import jsx from '@babel/plugin-syntax-jsx'
import * as bt from '@babel/types'
import { Visitor, NodePath } from '@babel/traverse'
import { buildCreateVNodeCall } from './buildCreateVNode'
import { buildFragment } from './buildFragment'
export * from './runtime'

export interface Options {
  optimizate?: boolean
  source?: 'vue' | '@vue/runtime-dom' | '@vue/runtime-core'
  jsxSource?: '@hcysunyang/babel-plugin-vue-next-jsx/dist/runtime.js'
}

export type State = {
  opts: Required<Options>
} & { visitorContext: VisitorContext }

const defaultOptions: Options = {
  optimizate: false,
  source: 'vue',
  jsxSource: '@hcysunyang/babel-plugin-vue-next-jsx/dist/runtime.js'
}

export interface VisitorContext {
  helpers: Set<string>
  jsxHelpers: Set<string>
  addHelper(name: string): bt.Identifier
  addJSXHelper(name: string): bt.Identifier
}

function createVisitorContext() {
  const context: VisitorContext = {
    helpers: new Set(),
    jsxHelpers: new Set(),
    addHelper(name) {
      context.helpers.add(name)
      return bt.identifier(name)
    },
    addJSXHelper(name) {
      context.jsxHelpers.add(name)
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
          state.opts = { ...defaultOptions, ...state.opts }
          state.visitorContext = createVisitorContext()
        },
        exit(rootPath: NodePath<bt.Program>, state: State) {
          const { helpers, jsxHelpers } = state.visitorContext
          const specifiers: bt.ImportDeclaration['specifiers'] = []
          let vueImportPath: NodePath<bt.ImportDeclaration> | null = null

          // find existing import declaration
          // import {...} from 'vue'
          // import {...} from '@vue/runtime-dom
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

          // jsx runtime helper
          if (!jsxHelpers.size) return
          const jsxSpecifiers: bt.ImportDeclaration['specifiers'] = []
          for (let helper of jsxHelpers) {
            jsxSpecifiers.push(
              bt.importSpecifier(bt.identifier(helper), bt.identifier(helper))
            )
          }
          const jsxRuntimImportDeclaration = bt.importDeclaration(
            jsxSpecifiers,
            bt.stringLiteral(state.opts.jsxSource)
          )
          rootPath.unshiftContainer('body', jsxRuntimImportDeclaration)
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
