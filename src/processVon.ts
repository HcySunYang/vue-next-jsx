import * as bt from '@babel/types'
import { NodePath } from '@babel/traverse'
import { camelize, capitalize, makeMap } from './utils'
import { FinallyExpression } from './buildCreateVNode'
import { State } from './main'
import { throwError, ErrorCodes } from './errors'

export const vonRE = /^v-on/

export function buildPropsForVon(
  attr: bt.JSXAttribute,
  attrPath: NodePath<bt.JSXAttribute>,
  state: State
) {
  if (!bt.isJSXExpressionContainer(attr.value)) {
    throwError(attrPath, ErrorCodes.X_INVALIDE_V_ON_VALUE)
  }

  const name = (attr.name as bt.JSXIdentifier).name.replace(vonRE, '')
  if (!name) {
    // v-on={ obj }
    const toHandlersHelper = state.visitorContext.addHelper('toHandlers')

    return bt.callExpression(toHandlersHelper, [
      attr.value.expression as FinallyExpression
    ])
  } else {
    if (name[0] !== '-') {
      throwError(attrPath, ErrorCodes.X_INVALIDE_V_ON_NAME)
    }

    const nameArr = name.slice(1).split('_')
    if (!nameArr.length) {
      throwError(attrPath, ErrorCodes.X_MISSING_V_ON_NAME)
    }

    let eventName = nameArr[0]
    const {
      keyModifiers,
      nonKeyModifiers,
      eventOptionModifiers
    } = generateModifiers(nameArr.slice(1))

    eventName = eventName.startsWith(`vnode`)
      ? `on${capitalize(camelize(eventName))}`
      : `on${capitalize(eventName)}`

    // normalize click.right and click.middle since they don't actually fire
    if (eventName.toLowerCase() === 'onclick') {
      eventName = nonKeyModifiers.includes('right')
        ? 'onContextmenu'
        : nonKeyModifiers.includes('middle')
        ? 'onMouseup'
        : eventName
    }

    let handlerExp = attr.value.expression as FinallyExpression

    if (nonKeyModifiers.length) {
      const withModifiersHelper = state.visitorContext.addHelper(
        'withModifiers'
      )
      handlerExp = bt.callExpression(withModifiersHelper, [
        handlerExp,
        bt.arrayExpression(nonKeyModifiers.map((m) => bt.stringLiteral(m)))
      ])
    }

    if (keyModifiers.length && isKeyboardEvent(eventName)) {
      const withKeysHelper = state.visitorContext.addHelper('withKeys')
      handlerExp = bt.callExpression(withKeysHelper, [
        handlerExp,
        bt.arrayExpression(keyModifiers.map((m) => bt.stringLiteral(m)))
      ])
    }

    if (eventOptionModifiers.length) {
      handlerExp = bt.objectExpression([
        bt.objectProperty(bt.stringLiteral('handler'), handlerExp),
        bt.objectProperty(
          bt.stringLiteral('options'),
          bt.objectExpression(
            eventOptionModifiers.map((m) =>
              bt.objectProperty(bt.stringLiteral(m), bt.booleanLiteral(true))
            )
          )
        )
      ])
    }

    return bt.objectProperty(bt.stringLiteral(eventName), handlerExp)
  }
}

const isEventOptionModifier = makeMap(`passive,once,capture`)
const isNonKeyModifier = makeMap(
  // event propagation management
  `stop,prevent,self,` +
    // system modifiers + exact
    `ctrl,shift,alt,meta,exact,` +
    // mouse
    `left,middle,right`
)
const isKeyboardEvent = makeMap(`onkeyup,onkeydown,onkeypress`, true)

const generateModifiers = (modifiers: string[]) => {
  const keyModifiers = []
  const nonKeyModifiers = []
  const eventOptionModifiers = []

  for (let i = 0; i < modifiers.length; i++) {
    const modifier = modifiers[i]

    if (isEventOptionModifier(modifier)) {
      // eventOptionModifiers: modifiers for addEventListener() options, e.g. .passive & .capture
      eventOptionModifiers.push(modifier)
    } else {
      // runtimeModifiers: modifiers that needs runtime guards
      if (isNonKeyModifier(modifier)) {
        nonKeyModifiers.push(modifier)
      } else {
        keyModifiers.push(modifier)
      }
    }
  }

  return {
    keyModifiers,
    nonKeyModifiers,
    eventOptionModifiers
  }
}
