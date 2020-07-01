import * as bt from '@babel/types'
import { VNodePropsArgs } from './buildCreateVNode'
import { isOn } from './utils'

export function analyzePatchFlag(props: VNodePropsArgs, isComponent: boolean) {
  let hasClassBinding = false
  let hasStyleBinding = false
  let hasHydrationEventBinding = false
  let dynamicPropName: string[] = []
  for (let i = 0; i < props.length; i++) {
    const prop = props[i]
    if (bt.isObjectProperty(prop)) {
      const key = (prop.key as bt.StringLiteral).value
      if (
        !isComponent &&
        isOn(key) &&
        key.toLowerCase() !== 'onclick' &&
        key !== 'onUpdate:modelValue'
      ) {
        hasHydrationEventBinding = true
      }

      if (bt.isStringLiteral(prop.value) || bt.isLiteral(prop.value)) {
        continue
      }

      // dynamic
      if (key === 'class') {
        hasClassBinding = true
      } else if (key === 'style') {
        hasStyleBinding = true
      } else if (key !== 'key' && !dynamicPropName.includes(key)) {
        dynamicPropName.push(key)
      }
    }
  }

  return {
    hasClassBinding,
    hasStyleBinding,
    hasHydrationEventBinding,
    dynamicPropName
  }
}

export const enum PatchFlags {
  TEXT = 1,
  CLASS = 1 << 1,
  STYLE = 1 << 2,
  PROPS = 1 << 3,
  FULL_PROPS = 1 << 4,
  HYDRATE_EVENTS = 1 << 5,
  STABLE_FRAGMENT = 1 << 6,
  KEYED_FRAGMENT = 1 << 7,
  UNKEYED_FRAGMENT = 1 << 8,
  NEED_PATCH = 1 << 9,
  DYNAMIC_SLOTS = 1 << 10,
  HOISTED = -1,
  BAIL = -2
}
