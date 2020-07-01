import * as bt from '@babel/types'
import { NodePath } from '@babel/traverse'
import { isHTMLTag, isSVGTag, transformJSXMemberExpression } from './utils'
import { processJSXText } from './processJSXText'
import { vonRE, buildPropsForVon } from './processVon'
import { vmodelRE, buildPropsForVmodel } from './processVmodel'
import { customDirRE } from './processCustomDirs'
import { vhtmlRE, buildPropsForVHtml } from './processVHtml'
import { vtextRE, buildPropsForVText } from './processVText'

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
type VNodeCallArgs = [NonNullable<TagType>, PropsType, ChildrenType]

export type AttributePaths = NodePath<bt.JSXAttribute | bt.JSXSpreadAttribute>[]

export type FinallyExpression = Exclude<
  bt.Expression,
  bt.JSXElement | bt.JSXFragment | bt.JSXEmptyExpression
>

export function buildCreateVNodeCall(
  jsxElementPath: NodePath<bt.JSXElement>
): bt.CallExpression {
  // build tag
  const openElement = jsxElementPath.node.openingElement
  const { tag, tagName, isComponent } = buildTag(openElement.name)
  if (bt.isNullLiteral(tag)) {
    throw jsxElementPath.buildCodeFrameError('Unsupported tag type')
  }

  const args: VNodeCallArgs = [tag, bt.nullLiteral(), bt.nullLiteral()]
  // build props
  const directives: bt.ArrayExpression[] = []
  if (openElement.attributes.length) {
    const { props, dirs } = buildProps(
      jsxElementPath.get('openingElement.attributes') as AttributePaths,
      tag,
      isComponent
    )
    args[1] = props
    directives.push(...dirs)
  }

  // build children
  if (jsxElementPath.node.children.length) {
    args[2] =
      isComponent &&
      tagName.toLowerCase() !== 'teleport' &&
      tagName.toLowerCase() !== 'keepalive'
        ? buildSlots(jsxElementPath.node.children) || bt.nullLiteral()
        : buildChildren(jsxElementPath.node.children)
  }

  return directives.length
    ? bt.callExpression(bt.identifier('withDirectives'), [
        bt.callExpression(bt.identifier('createVNode'), args),
        ...directives
      ])
    : bt.callExpression(bt.identifier('createVNode'), args)
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

type VNodePropsArgs = Array<
  bt.ObjectProperty | bt.SpreadElement | bt.CallExpression /* toHandlers() */
>
function buildProps(
  attrPaths: AttributePaths,
  tag: Exclude<TagType, bt.NullLiteral>,
  isComponent: boolean
): {
  props: bt.ObjectExpression | bt.CallExpression
  dirs: bt.ArrayExpression[]
} {
  const props: VNodePropsArgs = []
  let hasTohandlersCall = false
  let hasSpreadElement = false
  let dirs = []

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
            attrPaths[i] as NodePath<bt.JSXAttribute>
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
            isComponent
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

  if (hasTohandlersCall || hasSpreadElement) {
    if (props.length === 1) {
      return {
        props: props[0] as bt.CallExpression,
        dirs
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

    return {
      props: bt.callExpression(bt.identifier('mergeProps'), mergePropsArgs),
      dirs
    }
  }

  return {
    props: bt.objectExpression(
      props as Array<bt.ObjectProperty | bt.SpreadElement>
    ),
    dirs
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

function buildChildren(children: bt.JSXElement['children']) {
  return bt.arrayExpression(
    children
      .map((child) => {
        if (bt.isJSXText(child)) {
          const processedText = processJSXText(child)
          return !bt.isNullLiteral(processedText)
            ? bt.callExpression(
                bt.identifier('createTextVNode'),
                [processJSXText(child)].filter((_) => !bt.isNullLiteral(_))
              )
            : processedText
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
