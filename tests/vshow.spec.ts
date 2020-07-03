import { transformWithPlugin } from './utils'

describe('v-show', () => {
  test('works', () => {
    const code = `const el = <p v-show={ refVal.value }></p>`
    transformWithPlugin(code)
  })
})
