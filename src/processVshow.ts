import * as bt from '@babel/types'
import { NodePath } from '@babel/traverse'
import { FinallyExpression } from './buildCreateVNode'
import { State } from './main'

export const vshowRE = /^v-show/

export function processVshow(
  attr: bt.JSXAttribute,
  attrPath: NodePath<bt.JSXAttribute>,
  state: State
) {
  if (!bt.isJSXExpressionContainer(attr.value)) {
    throw attrPath.buildCodeFrameError(
      'Invalid v-show value, expect `JSXExpressionContainer`'
    )
  }

  const vShow = state.visitorContext.addHelper('vShow')
  return bt.arrayExpression([vShow, attr.value.expression as FinallyExpression])
}
