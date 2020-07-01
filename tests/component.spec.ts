import { transformWithPlugin } from './utils'

describe('Component', () => {
  test('Component with JSXExpressionContainer attribute', () => {
    const code = `const el = <div foo={<i></i>} bar={1 + 2} ></div>`
    transformWithPlugin(code)
  })

  test('Component with JSXSpreadAttribute attribute', () => {
    const code = `const el = <Comp foo="1" {...obj} />`
    transformWithPlugin(code)
  })
})
