import { transformWithPlugin } from './utils'

describe('v-on', () => {
  test('v-on with arguments', () => {
    const code = `<p v-on-click={ handler }></p>`
    transformWithPlugin(code)
  })

  test('v-on with modifiers', () => {
    const code = `<p v-on-click_stop_prevent={ handler }></p>`
    transformWithPlugin(code)
  })

  test('should normalize click.right', () => {
    const code = `<p v-on-click_right={ handler }></p>`
    transformWithPlugin(code)
  })

  test('should normalize click.middle', () => {
    const code = `<p v-on-click_middle={ handler }></p>`
    transformWithPlugin(code)
  })

  test('should be built as an option', () => {
    const code = `<p v-on-click_passive={ handler }></p>`
    transformWithPlugin(code)
  })

  test('should use withKeys', () => {
    const code = `<p v-on-keyup_esc={ handler }></p>`
    transformWithPlugin(code)
  })

  test('should use the `toHandlers` helper function', () => {
    const code = `<p v-on={ obj }></p>`
    transformWithPlugin(code)
  })

  test('should use the `mergeProps` helper function', () => {
    const code = `<p a="b" v-on={ obj } c='d' { ...$props }></p>`
    transformWithPlugin(code)
  })
})
