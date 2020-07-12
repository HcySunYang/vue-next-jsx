import * as bt from '@babel/types'
import { NodePath } from '@babel/traverse'
import { FinallyExpression } from './buildCreateVNode'
import { throwError, ErrorCodes } from './errors'

export const vtextRE = /^v-text$/

export function buildPropsForVText(
  attr: bt.JSXAttribute,
  attrPath: NodePath<bt.JSXAttribute>
) {
  if (!bt.isJSXExpressionContainer(attr.value)) {
    throwError(attrPath, ErrorCodes.X_INVALIDE_V_TEXT_VALUE)
  }

  return bt.objectProperty(
    bt.stringLiteral('textContent'),
    attr.value.expression as FinallyExpression
  )
}
