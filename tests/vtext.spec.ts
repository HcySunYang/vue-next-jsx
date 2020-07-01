import { transformWithPlugin } from './utils'

describe('v-text', () => {
  test('works', () => {
    const code = `<p v-text={ refVal.value }></p>`
    transformWithPlugin(code)
  })
})
