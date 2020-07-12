import * as bt from '@babel/types'
import { NodePath } from '@babel/traverse'
import { FinallyExpression } from './buildCreateVNode'
import { State } from './main'
import { throwError, ErrorCodes } from './errors'

export const vshowRE = /^v-show/

export function processVshow(
  attr: bt.JSXAttribute,
  attrPath: NodePath<bt.JSXAttribute>,
  state: State
) {
  if (!bt.isJSXExpressionContainer(attr.value)) {
    throwError(attrPath, ErrorCodes.X_INVALIDE_V_SHOW_VALUE)
  }

  const vShow = state.visitorContext.addHelper('vShow')
  return bt.arrayExpression([vShow, attr.value.expression as FinallyExpression])
}
