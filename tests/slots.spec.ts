import { transformWithPlugin } from './utils'

describe('Slots', () => {
  test('slots', () => {
    const code = `
      const el = (
        <Comp>
          { slots }
        </Comp>
      )
    `
    transformWithPlugin(code)
  })

  test('KeepAlive children should not be converted into slots', () => {
    const code = `
      const el = (
        <KeepAlive>
          <Comp/>
        </KeepAlive>
      )
    `
    transformWithPlugin(code)
  })

  test('TelePort children should not be converted into slots', () => {
    const code = `
      const el = (
        <TelePort>
          <Comp/>
        </TelePort>
      )
    `
    transformWithPlugin(code)
  })
})
