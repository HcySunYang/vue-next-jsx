import { transformWithPlugin } from './utils'

describe('v-model', () => {
  describe('Component: ', () => {
    test('default modelValue', () => {
      const code = `<Comp v-model={ ref.val } />`
      transformWithPlugin(code)
    })

    test('default modelValue (with modifiers)', () => {
      const code = `<Comp v-model_a_b={ ref.val } />`
      transformWithPlugin(code)
    })

    test('specify model prop name', () => {
      const code = `<Comp v-model-foo={ ref.val } />`
      transformWithPlugin(code)
    })

    test('specify model prop name (with modifiers)', () => {
      const code = `<Comp v-model-foo_a_b={ ref.val } />`
      transformWithPlugin(code)
    })

    test('specify model prop name (with other props)', () => {
      const code = `<Comp v-model-foo_a_b={ ref.val } a="b" />`
      transformWithPlugin(code)
    })

    test('specify model prop name (with v-on)', () => {
      const code = `<Comp v-model-foo_a_b={ ref.val } v-on={ obj } />`
      transformWithPlugin(code)
    })
  })

  describe('Element: ', () => {
    test('input with v-model', () => {
      const code = `<input v-model={ ref.val } />`
      transformWithPlugin(code)
    })

    test('textarea with v-model', () => {
      const code = `<textarea v-model={ ref.val } />`
      transformWithPlugin(code)
    })

    test('input with dynamic type attribute', () => {
      const code = `<input v-model={ ref.val } type={ refType.value } />`
      transformWithPlugin(code)
    })

    test('input with type=radio', () => {
      const code = `<input v-model={ ref.val } type="radio" />`
      transformWithPlugin(code)
    })

    test('input with type=checkbox', () => {
      const code = `<input v-model={ ref.val } type="checkbox" />`
      transformWithPlugin(code)
    })

    test('input with dynamic Key binding', () => {
      const code = `<input v-model={ ref.val } { ...props } />`
      transformWithPlugin(code)
    })

    test('input with dynamic Key binding + modifiers', () => {
      const code = `<input v-model_number={ ref.val } { ...props } />`
      transformWithPlugin(code)
    })
  })
})

describe('vModel', () => {
  describe('Element: ', () => {
    test('input with vModel', () => {
      const code = `<input vModel={ [ref.val] } />`
      transformWithPlugin(code)
    })

    test('textarea with vModel', () => {
      const code = `<textarea vModel={ [ref.val] } />`
      transformWithPlugin(code)
    })

    test('input with dynamic type attribute', () => {
      const code = `<input vModel={ [ref.val] } type={ refType.value } />`
      transformWithPlugin(code)
    })

    test('input with type=radio', () => {
      const code = `<input vModel={ [ref.val] } type="radio" />`
      transformWithPlugin(code)
    })

    test('input with type=checkbox', () => {
      const code = `<input vModel={ [ref.val] } type="checkbox" />`
      transformWithPlugin(code)
    })

    test('input with dynamic Key binding', () => {
      const code = `<input vModel={ [ref.val] } { ...props } />`
      transformWithPlugin(code)
    })

    test('input with dynamic Key binding + array modifiers', () => {
      const code = `<input vModel={ [ref.val, ['number', 'trim']] } { ...props } />`
      transformWithPlugin(code)
    })

    test('input with dynamic Key binding + object modifiers', () => {
      const code = `<input vModel={ [ref.val, { number: true }] } { ...props } />`
      transformWithPlugin(code)
    })
  })
})
