import * as bt from '@babel/types'
import { NodePath } from '@babel/traverse'
import { isHTMLTag, isSVGTag, transformJSXMemberExpression } from './utils'
import { processJSXText } from './processJSXText'
import { vonRE, buildPropsForVon } from './processVon'
import { vmodelRE, buildPropsForVmodel } from './processVmodel'
import { customDirRE } from './processCustomDirs'
import { vhtmlRE, buildPropsForVHtml } from './processVHtml'
import { vtextRE, buildPropsForVText } from './processVText'
import { State } from './main'
import { analyzePatchFlag, PatchFlags } from './analyzePatchFlag'

export type TagType =
  | bt.StringLiteral
  | bt.MemberExpression
  | bt.Identifier
  | bt.NullLiteral
type PropsType = bt.ObjectExpression | bt.CallExpression | bt.NullLiteral
type ChildrenType =
  | bt.ArrayExpression
  | bt.NullLiteral
  | bt.Expression /* slot */

type PatchFlagArg = bt.NumberLiteral | bt.NullLiteral
type DynamicPropArg = bt.ArrayExpression | bt.NullLiteral
type VNodeCallArgs = [
  NonNullable<TagType>,
  PropsType,
  ChildrenType,
  PatchFlagArg,
  DynamicPropArg
]

export type AttributePaths = NodePath<bt.JSXAttribute | bt.JSXSpreadAttribute>[]

export type FinallyExpression = Exclude<
  bt.Expression,
  bt.JSXElement | bt.JSXFragment | bt.JSXEmptyExpression
>

export function buildCreateVNodeCall(
  jsxElementPath: NodePath<bt.JSXElement>,
  state: State
): bt.CallExpression {
  // build tag
  const openElement = jsxElementPath.node.openingElement
  const { tag, tagName, isComponent } = buildTag(openElement.name)
  if (bt.isNullLiteral(tag)) {
    throw jsxElementPath.buildCodeFrameError('Unsupported tag type')
  }

  const args: VNodeCallArgs = [
    tag,
    bt.nullLiteral(),
    bt.nullLiteral(),
    bt.nullLiteral(),
    bt.nullLiteral()
  ]

  // build props
  const directives: bt.ArrayExpression[] = []
  if (openElement.attributes.length) {
    const { props, dirs, patchFlag, dynamicPropName } = buildProps(
      jsxElementPath.get('openingElement.attributes') as AttributePaths,
      tag,
      isComponent,
      state
    )
    args[1] = props
    directives.push(...dirs)

    if (patchFlag > 0) {
      args[3] = bt.numericLiteral(patchFlag)
    }
    if (dynamicPropName.length > 0) {
      args[4] = bt.arrayExpression(dynamicPropName)
    }
  }

  // build children
  if (jsxElementPath.node.children.length) {
    const shouldBuildAsSlot =
      isComponent &&
      tagName.toLowerCase() !== 'teleport' &&
      tagName.toLowerCase() !== 'keepalive'
    args[2] = shouldBuildAsSlot
      ? buildSlots(jsxElementPath.node.children) || bt.nullLiteral()
      : buildChildren(jsxElementPath.node.children, state)
  }

  // Remove null literals, reduce code size
  let arg = args[args.length - 1]
  while (bt.isNullLiteral(arg)) {
    ;(args.length as number) = args.length - 1
    arg = args[args.length - 1]
  }

  const createVNodeHelper = state.visitorContext.addHelper('createVNode')
  if (directives.length) {
    const withDirectivesHelper = state.visitorContext.addHelper(
      'withDirectives'
    )
    return bt.callExpression(withDirectivesHelper, [
      bt.callExpression(createVNodeHelper, args),
      ...directives
    ])
  }

  return bt.callExpression(createVNodeHelper, args)
}

function buildTag(openName: bt.JSXOpeningElement['name']) {
  let tag: TagType = bt.nullLiteral()
  let tagName: string = ''
  let isComponent = false
  if (bt.isJSXIdentifier(openName)) {
    if (isHTMLTag(openName.name) || isSVGTag(openName.name)) {
      tag = bt.stringLiteral(openName.name)
    } else {
      isComponent = true
      tag = bt.identifier(openName.name)
    }
    tagName = openName.name
  } else if (bt.isJSXMemberExpression(openName)) {
    tag = transformJSXMemberExpression(openName)
  }
  return {
    tag,
    tagName,
    isComponent
  }
}

export type VNodePropsArgs = Array<
  bt.ObjectProperty | bt.SpreadElement | bt.CallExpression /* toHandlers() */
>
function buildProps(
  attrPaths: AttributePaths,
  tag: Exclude<TagType, bt.NullLiteral>,
  isComponent: boolean,
  state: State
): {
  props: bt.ObjectExpression | bt.CallExpression
  dirs: bt.ArrayExpression[]
  patchFlag: number
  dynamicPropName: bt.StringLiteral[]
} {
  const props: VNodePropsArgs = []
  let hasTohandlersCall = false
  let hasSpreadElement = false
  let dirs = []
  let patchFlag = 0
  const dynamicProps: bt.StringLiteral[] = []

  for (let i = 0; i < attrPaths.length; i++) {
    const attr = attrPaths[i].node

    if (bt.isJSXAttribute(attr)) {
      const value =
        processJSXAttrValue(attr.value) || bt.identifier('undefined')

      if (bt.isJSXNamespacedName(attr.name)) {
        props.push(
          bt.objectProperty(
            bt.stringLiteral(
              attr.name.namespace.name + ':' + attr.name.name.name
            ),
            value
          )
        )
      } else {
        const isVon = vonRE.test(attr.name.name)
        const isVmodel = vmodelRE.test(attr.name.name)
        const isVHtml = vhtmlRE.test(attr.name.name)
        const isVText = vtextRE.test(attr.name.name)
        const isCustomDir = customDirRE.test(attr.name.name)

        if (isVon) {
          // v-on
          const vonProp = buildPropsForVon(
            attr,
            attrPaths[i] as NodePath<bt.JSXAttribute>,
            state
          )

          // v-on={ ... }
          hasTohandlersCall = bt.isCallExpression(vonProp)

          props.push(vonProp)
        } else if (isVmodel) {
          // v-model
          const vmodelProps = buildPropsForVmodel(
            attr,
            attrPaths[i] as NodePath<bt.JSXAttribute>,
            attrPaths,
            tag,
            isComponent,
            state
          )
          if (vmodelProps) {
            if (Array.isArray(vmodelProps)) {
              props.push(...vmodelProps)
            } else {
              dirs.push(vmodelProps.dirArg)
              props.push(...vmodelProps.ret)
            }
          }
        } else if (isVHtml) {
          const htmlProp = buildPropsForVHtml(
            attr,
            attrPaths[i] as NodePath<bt.JSXAttribute>
          )
          props.push(htmlProp)
        } else if (isVText) {
          const textContentProp = buildPropsForVText(
            attr,
            attrPaths[i] as NodePath<bt.JSXAttribute>
          )
          props.push(textContentProp)
        } else if (isCustomDir) {
          // TODO
        } else {
          props.push(bt.objectProperty(bt.stringLiteral(attr.name.name), value))
        }
      }
    } else {
      hasSpreadElement = true
      props.push(bt.spreadElement(attr.argument))
    }
  }

  if (state.opts.optimizate) {
    if (hasTohandlersCall || hasSpreadElement) {
      patchFlag |= PatchFlags.FULL_PROPS
    } else {
      // analyze PatchFlag
      const {
        hasClassBinding,
        hasStyleBinding,
        hasHydrationEventBinding,
        dynamicPropName
      } = analyzePatchFlag(props, isComponent)

      hasClassBinding && (patchFlag |= PatchFlags.CLASS)
      hasStyleBinding && (patchFlag |= PatchFlags.STYLE)
      hasHydrationEventBinding && (patchFlag |= PatchFlags.HYDRATE_EVENTS)

      if (dynamicPropName.length > 0) {
        patchFlag |= PatchFlags.PROPS
        dynamicProps.push(
          ...dynamicPropName.map((name) => bt.stringLiteral(name))
        )
      }
    }
  }

  if (hasTohandlersCall || hasSpreadElement) {
    if (props.length === 1) {
      return {
        props: props[0] as bt.CallExpression,
        dirs,
        patchFlag,
        dynamicPropName: dynamicProps
      }
    }

    const mergePropsArgs: Array<
      bt.ObjectExpression | bt.CallExpression | bt.SpreadElement
    > = []
    let currentObjectProperties: bt.ObjectProperty[] = []
    // mergeProps
    props.forEach((exp) => {
      if (bt.isObjectProperty(exp)) {
        currentObjectProperties.push(exp)
      } else {
        if (currentObjectProperties.length) {
          mergePropsArgs.push(bt.objectExpression(currentObjectProperties))
          // reset
          currentObjectProperties = []
        }

        if (bt.isSpreadElement(exp)) {
          mergePropsArgs.push(bt.objectExpression([exp]))
        } else {
          mergePropsArgs.push(exp)
        }
      }
    })
    if (currentObjectProperties.length) {
      mergePropsArgs.push(bt.objectExpression(currentObjectProperties))
    }

    const mergePropsHelper = state.visitorContext.addHelper('mergeProps')
    return {
      props: bt.callExpression(mergePropsHelper, mergePropsArgs),
      dirs,
      patchFlag,
      dynamicPropName: dynamicProps
    }
  }

  return {
    props: bt.objectExpression(
      props as Array<bt.ObjectProperty | bt.SpreadElement>
    ),
    dirs,
    patchFlag,
    dynamicPropName: dynamicProps
  }
}

function processJSXAttrValue(value: bt.JSXAttribute['value']) {
  if (bt.isStringLiteral(value)) {
    return value
  } else if (bt.isJSXExpressionContainer(value)) {
    // Attribute value cannot be bt.JSXEmptyExpression,
    // and bt.JSXElement or bt.JSXFragment have been converted to CallExpression.
    return value.expression as FinallyExpression
  } else {
    return value
  }
}

export function buildChildren(
  children: bt.JSXElement['children'],
  state: State
) {
  return bt.arrayExpression(
    children
      .map((child) => {
        if (bt.isJSXText(child)) {
          const processedText = processJSXText(child)
          if (!bt.isNullLiteral(processedText)) {
            const createTextVNodeHelper = state.visitorContext.addHelper(
              'createTextVNode'
            )
            return bt.callExpression(
              createTextVNodeHelper,
              [processJSXText(child)].filter((_) => !bt.isNullLiteral(_))
            )
          }
          return processedText
        } else if (bt.isJSXExpressionContainer(child)) {
          return child.expression as FinallyExpression
        } else if (bt.isJSXSpreadChild(child)) {
          return bt.spreadElement(child.expression)
        }

        return (child as any) as bt.CallExpression
      })
      .filter((_) => !bt.isNullLiteral(_) && !bt.isJSXEmptyExpression(_))
  )
}

function buildSlots(children: bt.JSXElement['children']) {
  let firstExpContainer: bt.JSXExpressionContainer | null = null
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    if (bt.isJSXExpressionContainer(child)) {
      firstExpContainer = child
      break
    }
  }

  if (firstExpContainer) {
    return firstExpContainer.expression as FinallyExpression
  }
}
