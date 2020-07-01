import { transformWithPlugin } from './utils'

describe('v-html', () => {
  test('works', () => {
    const code = `<p v-html={ refVal.value }></p>`
    transformWithPlugin(code)
  })
})
