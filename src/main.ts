import jsx from '@babel/plugin-syntax-jsx'
import * as bt from '@babel/types'
import { Visitor, NodePath } from '@babel/traverse'
import { buildCreateVNodeCall } from './buildCreateVNode'

export interface Options {
  optimizate?: boolean
}

export interface State {
  opts: Options
}

export default function VueNextJSX() {
  return {
    inherits: jsx,
    visitor: {
      JSXElement: {
        exit(path: NodePath<bt.JSXElement>, state: State) {
          path.replaceWith(buildCreateVNodeCall(path, state))
        }
      }
    } as Visitor
  }
}
