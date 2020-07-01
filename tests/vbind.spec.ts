import { transformWithPlugin } from './utils'

describe('v-bind', () => {
  test('spread element', () => {
    const code = `<p { ...obj }></p>`
    transformWithPlugin(code)
  })

  test('spread element (mergeProps)', () => {
    const code = `<p a="b" { ...obj } c={ 1 }></p>`
    transformWithPlugin(code)
  })
})
