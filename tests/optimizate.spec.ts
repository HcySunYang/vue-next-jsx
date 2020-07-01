import { transformWithPlugin } from './utils'

describe('Optimizate: ', () => {
  test('PatchFLags.CLASS', () => {
    const code = `const el = <p class={ foo }></p>`
    transformWithPlugin(code, { optimizate: true })
  })

  test('PatchFLags.STYLE', () => {
    const code = `const el = <p style={ foo }></p>`
    transformWithPlugin(code, { optimizate: true })
  })

  test('PatchFLags.PROPS', () => {
    const code = `const el = <p id={ foo }></p>`
    transformWithPlugin(code, { optimizate: true })
  })

  test('PatchFLags.PROPS: v-on-xxx={}', () => {
    const code = `const el = <p v-on-click={ handler }></p>`
    transformWithPlugin(code, { optimizate: true })
  })

  test('PatchFLags.PROPS/PatchFLags.HYDRATE_EVENTS: v-on-click_right={}', () => {
    const code = `const el = <p v-on-click_right={ handler }></p>`
    transformWithPlugin(code, { optimizate: true })
  })

  test('PatchFLags.PROPS/PatchFLags.HYDRATE_EVENTS: v-on-click_middle={}', () => {
    const code = `const el = <p v-on-click_middle={ handler }></p>`
    transformWithPlugin(code, { optimizate: true })
  })

  test('PatchFLags.PROPS/PatchFLags.HYDRATE_EVENTS: v-on-keyup_esc={}', () => {
    const code = `const el = <p v-on-keyup_esc={ handler }></p>`
    transformWithPlugin(code, { optimizate: true })
  })

  test('PatchFLags.FULL_PROPS: v-on', () => {
    const code = `const el = <p v-on={ refVal.obj }></p>`
    transformWithPlugin(code, { optimizate: true })
  })

  test('PatchFLags.FULL_PROPS: JSXSpreadAttribute', () => {
    const code = `const el = <p {...obj}></p>`
    transformWithPlugin(code, { optimizate: true })
  })

  test('PatchFLags.FULL_PROPS: JSXSpreadAttribute + dynamic', () => {
    const code = `const el = <p {...obj} id={ foo }></p>`
    transformWithPlugin(code, { optimizate: true })
  })

  test('PatchFLags: v-model + input', () => {
    const code = `const el = <input v-model={ refVal.value } />`
    transformWithPlugin(code, { optimizate: true })
  })

  test('PatchFLags: v-model + input + dynamic type', () => {
    const code = `const el = <input v-model={ refVal.value } type={ refType.value } />`
    transformWithPlugin(code, { optimizate: true })
  })

  test('PatchFLags: v-model + input + dynamic type', () => {
    const code = `const el = <input v-model={ refVal.value } type={ refType.value } />`
    transformWithPlugin(code, { optimizate: true })
  })

  test('PatchFLags: Component v-model-foo_a_b ', () => {
    const code = `const el = <Comp v-model-foo_a_b={ refVal.value } />`
    transformWithPlugin(code, { optimizate: true })
  })
})
