import { transformWithPlugin } from './utils'

describe('Optimizate: ', () => {
  test('slots', () => {
    const code = `const el = <p></p>`
    transformWithPlugin(code, { optimizate: true })
  })
})
