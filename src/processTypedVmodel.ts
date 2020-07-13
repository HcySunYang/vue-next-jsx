import * as bt from '@babel/types'
import { NodePath } from '@babel/traverse'
import { TagType, AttributePaths, FinallyExpression } from './buildCreateVNode'
import { throwError, ErrorCodes } from './errors'
import { resolveDiretiveToUse } from './processVmodel'
import { State } from './main'

export const typedVmodelRE = /^vModel/

export function buildPropsForTypedVmodel(
  attr: bt.JSXAttribute,
  attrPath: NodePath<bt.JSXAttribute>,
  attrPaths: AttributePaths,
  tag: Exclude<TagType, bt.NullLiteral>,
  state: State
) {
  if (!bt.isJSXExpressionContainer(attr.value)) {
    throwError(attrPath, ErrorCodes.X_INVALIDE_V_MODEL_VALUE)
  }

  const helper = state.visitorContext.addHelper

  if (bt.isStringLiteral(tag)) {
    const tagName = tag.value
    // Intrinaic elements: input select textarea
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
      const { directiveToUse, isInvalidType } = resolveDiretiveToUse(
        tagName,
        attrPaths
      )

      if (!isInvalidType) {
        const propName = 'modelValue'
        const eventName = `onUpdate:${propName}`

        const result = processIntrinaicVmodelValue(
          attr.value.expression,
          attrPath
        )

        if (result) {
          // native vmodel doesn't need the `modelValue` props since they are also
          // passed to the runtime as `binding.value`.
          const ret = [
            bt.objectProperty(
              bt.stringLiteral(eventName),
              bt.arrowFunctionExpression(
                [bt.identifier('$event')],
                bt.assignmentExpression(
                  '=',
                  result.valueExp,
                  bt.identifier('$event')
                )
              )
            )
          ]

          const arrayExpArgs: FinallyExpression[] = [
            helper(directiveToUse),
            result.valueExp as FinallyExpression
          ]
          if (result.modifiersExp) {
            arrayExpArgs.push(bt.identifier('void 0'), result.modifiersExp)
          }

          return {
            ret,
            dirArg: bt.arrayExpression(arrayExpArgs)
          }
        }
      }
    } else {
      throwError(attrPath, ErrorCodes.X_V_MODEL_ON_INVALID_ELEMENT)
    }
  } else {
    // component
  }
}

interface IntrinaicVmodelRes {
  valueExp: bt.LVal
  modifiersExp?: bt.ObjectExpression
}
function processIntrinaicVmodelValue(
  exp: bt.JSXExpressionContainer['expression'],
  attrPath: NodePath<bt.JSXAttribute>
) {
  if (!bt.isArrayExpression(exp)) {
    throwError(attrPath, ErrorCodes.X_INVALIDE_TYPED_V_MODEL_VALUE)
  }
  const eles = exp.elements
  if (eles.length) {
    const valueExp = eles[0] as bt.LVal
    const originalModifiersExp = eles[1]

    const processRes: IntrinaicVmodelRes = {
      valueExp
    }

    let modifiersExp: bt.ObjectExpression = bt.objectExpression([])
    if (originalModifiersExp) {
      if (
        !bt.isArrayExpression(originalModifiersExp) &&
        !bt.isObjectExpression(originalModifiersExp)
      ) {
        throwError(attrPath, ErrorCodes.X_INVALIDE_TYPED_V_MODEL_MODIFIERS)
      }

      if (bt.isObjectExpression(originalModifiersExp)) {
        modifiersExp = originalModifiersExp
      } else {
        originalModifiersExp.elements.forEach((ele) => {
          modifiersExp.properties.push(
            bt.objectProperty(ele as bt.StringLiteral, bt.booleanLiteral(true))
          )
        })
      }
    }

    if (modifiersExp.properties.length) {
      processRes.modifiersExp = modifiersExp
    }

    return processRes
  }
}
