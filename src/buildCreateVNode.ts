import * as bt from '@babel/types'
import { NodePath } from '@babel/traverse'
import { isHTMLTag, isSVGTag, transformJSXMemberExpression } from './utils'
import { processJSXText } from './processJSXText'
import { vonRE, buildPropsForVon } from './processVon'

type TagType =
  | bt.StringLiteral
  | bt.MemberExpression
  | bt.Identifier
  | bt.NullLiteral
type PropsType = bt.ObjectExpression | bt.NullLiteral
type ChildrenType =
  | bt.ArrayExpression
  | bt.NullLiteral
  | bt.Expression /* slot */
type VNodeCallArgs = [NonNullable<TagType>, PropsType, ChildrenType]

type AttributePaths = NodePath<bt.JSXAttribute | bt.JSXSpreadAttribute>[]

export type FinallyExpression = Exclude<
  bt.Expression,
  bt.JSXElement | bt.JSXFragment | bt.JSXEmptyExpression
>

export function buildCreateVNodeCall(
  jsxElementPath: NodePath<bt.JSXElement>
): bt.CallExpression {
  // build tag
  const openElement = jsxElementPath.node.openingElement
  const { tag, isComponent } = buildTag(openElement.name)
  if (bt.isNullLiteral(tag)) {
    throw jsxElementPath.buildCodeFrameError('Unsupported tag type')
  }

  const args: VNodeCallArgs = [tag, bt.nullLiteral(), bt.nullLiteral()]
  // build props
  if (openElement.attributes.length) {
    const props = buildAttributes(
      jsxElementPath.get('openingElement.attributes') as AttributePaths
    )
    args[1] = props
  }

  // build children
  if (jsxElementPath.node.children.length) {
    args[2] = isComponent
      ? buildSlots(jsxElementPath.node.children) || bt.nullLiteral()
      : buildChildren(jsxElementPath.node.children)
  }

  return bt.callExpression(bt.identifier('createVNode'), args)
}

function buildTag(openName: bt.JSXOpeningElement['name']) {
  let tag: TagType = bt.nullLiteral()
  let isComponent = false
  if (bt.isJSXIdentifier(openName)) {
    if (isHTMLTag(openName.name) || isSVGTag(openName.name)) {
      tag = bt.stringLiteral(openName.name)
    } else {
      isComponent = true
      tag = bt.identifier(openName.name)
    }
  } else if (bt.isJSXMemberExpression(openName)) {
    tag = transformJSXMemberExpression(openName)
  }
  return {
    tag,
    isComponent
  }
}

function buildAttributes(attrPaths: AttributePaths): bt.ObjectExpression {
  const props: Array<bt.ObjectProperty | bt.SpreadElement> = []

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
        if (isVon) {
          const vonProp = buildPropsForVon(
            attr,
            attrPaths[i] as NodePath<bt.JSXAttribute>
          )
          if (vonProp) props.push(vonProp)
        } else {
          props.push(bt.objectProperty(bt.stringLiteral(attr.name.name), value))
        }
      }
    } else {
      props.push(bt.spreadElement(attr.argument))
    }
  }

  return bt.objectExpression(props)
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
