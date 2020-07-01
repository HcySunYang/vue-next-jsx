import jsx from '@babel/plugin-syntax-jsx'
import * as bt from '@babel/types'
import { Visitor, NodePath } from '@babel/traverse'
import { buildCreateVNodeCall } from './buildCreateVNode'

export default function VueNextJSX() {
  return {
    inherits: jsx,
    visitor: {
      JSXElement: {
        exit(path: NodePath<bt.JSXElement>) {
          path.replaceWith(buildCreateVNodeCall(path))
        }
      }
    } as Visitor
  }
}
