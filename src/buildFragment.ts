import * as bt from '@babel/types'
import { NodePath } from '@babel/traverse'
import { State } from './main'
import { buildChildren } from './buildCreateVNode'

export function buildFragment(
  jsxElementPath: NodePath<bt.JSXFragment>,
  state: State
) {
  const createVNode = state.visitorContext.addHelper('createVNode')
  const Fragment = state.visitorContext.addHelper('Fragment')
  return bt.callExpression(createVNode, [
    Fragment,
    bt.nullLiteral(),
    buildChildren(jsxElementPath.node.children, state)
  ])
}
