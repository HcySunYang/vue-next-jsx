import * as bt from '@babel/types'
import { NodePath } from '@babel/traverse'
import { FinallyExpression } from './buildCreateVNode'

export const vhtmlRE = /^v-html$/

export function buildPropsForVHtml(
  attr: bt.JSXAttribute,
  attrPath: NodePath<bt.JSXAttribute>
) {
  if (!bt.isJSXExpressionContainer(attr.value)) {
    throw attrPath.buildCodeFrameError('Invalid v-html value')
  }

  return bt.objectProperty(
    bt.stringLiteral('innerHTML'),
    attr.value.expression as FinallyExpression
  )
}
