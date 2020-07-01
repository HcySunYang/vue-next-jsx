import { transformWithPlugin } from './utils'

describe('Slots', () => {
  test('Default slot', () => {
    const code = `
      const el = (
        <Comp>
          { slots }
        </Comp>
      )
    `
    transformWithPlugin(code)
  })
})
