import * as bt from '@babel/types'
import { NodePath } from '@babel/traverse'
import { camelize, capitalize, makeMap } from './utils'
import { FinallyExpression } from './buildCreateVNode'

export const vonRE = /^v-on/

export function buildPropsForVon(
  attr: bt.JSXAttribute,
  attrPath: NodePath<bt.JSXAttribute>
) {
  if (!bt.isJSXExpressionContainer(attr.value)) {
    throw attrPath.buildCodeFrameError('Invalid event handler function')
  }

  const name = (attr.name as bt.JSXIdentifier).name.replace(vonRE, '')
  if (!name) {
    // v-on={ obj }
  } else {
    if (name[0] !== '-') {
      throw attrPath.buildCodeFrameError('Invalid event name')
    }

    const nameArr = name.slice(1).split('_')
    if (!nameArr.length) {
      throw attrPath.buildCodeFrameError('Missing event name')
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
      handlerExp = bt.callExpression(bt.identifier('withModifiers'), [
        handlerExp,
        bt.arrayExpression(nonKeyModifiers.map((m) => bt.stringLiteral(m)))
      ])
    }

    if (keyModifiers.length && isKeyboardEvent(eventName)) {
      handlerExp = bt.callExpression(bt.identifier('withKeys'), [
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
