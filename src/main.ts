import jsx from '@babel/plugin-syntax-jsx'
import * as bt from '@babel/types'
import { Visitor, NodePath } from '@babel/traverse'
import { buildCreateVNodeCall } from './buildCreateVNode'
import { buildFragment } from './buildFragment'

export interface Options {
  optimizate?: boolean
  source?: 'vue' | '@vue/runtime-dom' | '@vue/runtime-core'
}

export type State = {
  opts: Required<Options>
} & { visitorContext: VisitorContext }

const defaultOptions: Options = {
  optimizate: false,
  source: 'vue'
}

interface VisitorContext {
  helpers: Set<string>
  addHelper(name: string): bt.Identifier
}

function createVisitorContext() {
  const context: VisitorContext = {
    helpers: new Set(),
    addHelper(name) {
      context.helpers.add(name)
      return bt.identifier(name)
    }
  }

  return context
}

export default function VueNextJSX() {
  return {
    inherits: jsx,
    visitor: {
      Program: {
        enter(path: NodePath<bt.Program>, state: State) {
          state.visitorContext = createVisitorContext()
        },
        exit(rootPath: NodePath<bt.Program>, state: State) {
          const specifiers: bt.ImportDeclaration['specifiers'] = []
          let vueImportPath: NodePath<bt.ImportDeclaration> | null = null

          // find existing import declaration
          const bodyPaths = rootPath.get('body')
          const vueImportPaths = bodyPaths.filter(
            (p) =>
              bt.isImportDeclaration(p.node) &&
              p.node.source.value === state.opts.source
          )
          if (vueImportPaths.length) {
            vueImportPath = vueImportPaths[0] as NodePath<bt.ImportDeclaration>

            specifiers.push(...vueImportPath.node.specifiers)
          }

          // add helpers
          const { helpers } = state.visitorContext
          for (let helper of helpers) {
            const has = specifiers.some((specifier) => {
              return (
                bt.isImportSpecifier(specifier) &&
                specifier.imported.name === helper
              )
            })

            if (!has) {
              specifiers.push(
                bt.importSpecifier(bt.identifier(helper), bt.identifier(helper))
              )
            }
          }

          // build a new ImportDeclaration statement
          const newImportDeclaration = bt.importDeclaration(
            specifiers,
            bt.stringLiteral(state.opts.source)
          )

          if (vueImportPath) {
            vueImportPath.replaceWith(newImportDeclaration)
          } else if (specifiers.length) {
            rootPath.unshiftContainer('body', newImportDeclaration)
          }
        }
      },
      JSXElement: {
        exit(path: NodePath<bt.JSXElement>, state: State) {
          state.opts = { ...defaultOptions, ...state.opts }
          path.replaceWith(buildCreateVNodeCall(path, state))
        }
      },
      JSXFragment: {
        exit(path: NodePath<bt.JSXFragment>, state: State) {
          state.opts = { ...defaultOptions, ...state.opts }
          path.replaceWith(buildFragment(path, state))
        }
      }
    } as Visitor
  }
}
