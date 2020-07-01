import * as bt from '@babel/types'
import { NodePath } from '@babel/traverse'
import { FinallyExpression, TagType, AttributePaths } from './buildCreateVNode'
import { State } from './main'

export const vmodelRE = /^v-model/

const dirMap = {
  V_MODEL_TEXT: 'vModelText',
  V_MODEL_RADIO: 'vModelRadio',
  V_MODEL_CHECKBOX: 'vModelCheckbox',
  V_MODEL_DYNAMIC: 'vModelDynamic',
  V_MODEL_SELECT: 'vModelSelect'
}

export function buildPropsForVmodel(
  attr: bt.JSXAttribute,
  attrPath: NodePath<bt.JSXAttribute>,
  attrPaths: AttributePaths,
  tag: Exclude<TagType, bt.NullLiteral>,
  isComponent: boolean,
  state: State
) {
  if (!bt.isJSXExpressionContainer(attr.value)) {
    throw attrPath.buildCodeFrameError('Invalid v-model value')
  }

  const name = (attr.name as bt.JSXIdentifier).name.replace(vmodelRE, '')

  let propName = name ? name : 'modelValue'
  const modifiers: string[] = []

  if (!name) {
    // v-model={...}
    propName = 'modelValue'
  } else {
    if (name[0] === '_') {
      // v-model_a_b
      propName = 'modelValue'
      modifiers.push(...name.slice(1).split('_'))
    } else if (name[0] !== '-') {
      throw attrPath.buildCodeFrameError('Invalid v-model arg')
    } else {
      // v-model-foo_a_b
      const nameArr = name.slice(1).split('_')
      if (!nameArr.length) {
        throw attrPath.buildCodeFrameError('Missing v-model arg')
      }

      propName = nameArr[0]
      modifiers.push(...nameArr.slice(1))
    }
  }

  const eventName = `onUpdate:${propName}`

  const ret = [
    bt.objectProperty(
      bt.stringLiteral(propName),
      attr.value.expression as FinallyExpression
    ),
    bt.objectProperty(
      bt.stringLiteral(eventName),
      bt.arrowFunctionExpression(
        [bt.identifier('$event')],
        bt.assignmentExpression(
          '=',
          attr.value.expression as bt.LVal,
          bt.identifier('$event')
        )
      )
    )
  ]

  if (modifiers.length && isComponent) {
    ret.push(
      bt.objectProperty(
        bt.stringLiteral(
          propName === 'modelValue' ? 'modelModifiers' : `${propName}Modifiers`
        ),
        bt.objectExpression(
          modifiers.map((m) => {
            return bt.objectProperty(
              bt.stringLiteral(m),
              bt.booleanLiteral(true)
            )
          })
        )
      )
    )
  }

  if (isComponent) return ret

  // element: input / select / textarea

  if (propName !== 'modelValue') {
    throw attrPath.buildCodeFrameError(
      'v-model argument is not supported on plain elements'
    )
  }

  const tagName = (tag as bt.StringLiteral).value
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    let directiveToUse = dirMap.V_MODEL_TEXT
    let isInvalidType = false
    if (tagName === 'input') {
      const findResult = findProp(attrPaths, 'type')
      if (findResult) {
        const { path, node } = findResult

        if (bt.isJSXExpressionContainer(node.value)) {
          // type={ refType.value }
          directiveToUse = dirMap.V_MODEL_DYNAMIC
        } else if (bt.isStringLiteral(node.value)) {
          switch (node.value.value) {
            case 'radio':
              directiveToUse = dirMap.V_MODEL_RADIO
              break
            case 'checkbox':
              directiveToUse = dirMap.V_MODEL_CHECKBOX
              break
            case 'file':
              isInvalidType = true
              throw path.buildCodeFrameError(
                'v-model cannot used on file inputs since they are read-only. Use a v-on:change listener instead.'
              )
            default:
              // text type
              checkDuplicatedValue(attrPaths)
              break
          }
        }
      } else if (hasDynamicKeyVBind(attrPaths)) {
        // element has bindings with dynamic keys, which can possibly contain
        // "type".
        directiveToUse = dirMap.V_MODEL_DYNAMIC
      } else {
        // text type
        checkDuplicatedValue(attrPaths)
      }
    } else if (tagName === 'select') {
      directiveToUse = dirMap.V_MODEL_SELECT
    } else if (tagName === 'textarea') {
      checkDuplicatedValue(attrPaths)
    }

    // inject runtime directive
    // by returning the helper symbol via needRuntime
    // the import will replaced a resolveDirective call.
    if (!isInvalidType) {
      // native vmodel doesn't need the `modelValue` props since they are also
      // passed to the runtime as `binding.value`. removing it reduces code size.
      ret.shift()

      const dirHelper = state.visitorContext.addHelper(directiveToUse)
      return {
        ret,
        needRuntime: true,
        dirArg: bt.arrayExpression([
          dirHelper,
          attr.value.expression as FinallyExpression
        ])
      }
    }
  } else {
    throw attrPath.buildCodeFrameError(
      'v-model can only be used on <input>, <textarea> and <select> elements.'
    )
  }
}

function findProp(attrPaths: AttributePaths, name: string) {
  for (let i = 0; i < attrPaths.length; i++) {
    const attrPath = attrPaths[i]
    if (bt.isJSXAttribute(attrPath.node)) {
      if ((attrPath.node.name as bt.JSXIdentifier).name === name) {
        return {
          path: attrPath,
          node: attrPath.node
        }
      }
    }
  }
}

function checkDuplicatedValue(attrPaths: AttributePaths) {
  const ret = findProp(attrPaths, 'value')
  if (ret) {
    throw ret.path.buildCodeFrameError(
      `Unnecessary value binding used alongside v-model. It will interfere with v-model's behavior.`
    )
  }
}

function hasDynamicKeyVBind(attrPaths: AttributePaths) {
  return attrPaths.some((path) => bt.isJSXSpreadAttribute(path.node))
}
