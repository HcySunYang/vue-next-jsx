import { transformWithPlugin } from './utils'

describe('Element', () => {
  test('Normal element', () => {
    const code = `const el = <p></p>`
    transformWithPlugin(code)
  })

  test('Normal element with children', () => {
    const code = `
      const el = <p><i>hello</i> { ref.value }</p>
    `
    transformWithPlugin(code)
  })

  test('Normal element(self-closing)', () => {
    const code = `const el = <input id="foo"/>`
    transformWithPlugin(code)
  })

  test('Normal element with normal attribute', () => {
    const code = `const el = <p id="1" class='abc'></p>`
    transformWithPlugin(code)
  })

  test('Normal element with spread attribute', () => {
    const code = `const el = <div { ...attrs } id="foo" ></div>`
    transformWithPlugin(code)
  })

  test('Normal element with normal attribute', () => {
    const code = `const el = <p id="1" class='abc'></p>`
    transformWithPlugin(code)
  })

  test('Normal elements with children', () => {
    const code = `
    const el = (
      <div>
        <p>foo</p>
        TEXT
        { ...slots.bar() }
        { item }
      </div>
    )
    `
    transformWithPlugin(code)
  })
})
