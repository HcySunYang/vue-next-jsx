import * as bt from '@babel/types'
import { NodePath } from '@babel/traverse'
import { FinallyExpression } from './buildCreateVNode'
import { throwError, ErrorCodes } from './errors'

export const vhtmlRE = /^v-html$/

export function buildPropsForVHtml(
  attr: bt.JSXAttribute,
  attrPath: NodePath<bt.JSXAttribute>
) {
  if (!bt.isJSXExpressionContainer(attr.value)) {
    throwError(attrPath, ErrorCodes.X_INVALIDE_V_HTML_VALUE)
  }

  return bt.objectProperty(
    bt.stringLiteral('innerHTML'),
    attr.value.expression as FinallyExpression
  )
}
