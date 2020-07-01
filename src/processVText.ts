import * as bt from '@babel/types'
import { NodePath } from '@babel/traverse'
import { FinallyExpression } from './buildCreateVNode'

export const vtextRE = /^v-text$/

export function buildPropsForVText(
  attr: bt.JSXAttribute,
  attrPath: NodePath<bt.JSXAttribute>
) {
  if (!bt.isJSXExpressionContainer(attr.value)) {
    throw attrPath.buildCodeFrameError('Invalid v-text value')
  }

  return bt.objectProperty(
    bt.stringLiteral('textContent'),
    attr.value.expression as FinallyExpression
  )
}
