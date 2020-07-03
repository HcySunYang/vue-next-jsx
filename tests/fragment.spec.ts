import { transformWithPlugin } from './utils'

describe('Fragment', () => {
  test('<>', () => {
    const code = `
      const el = (
        <>
          <p></p>
        </>
      )
    `
    transformWithPlugin(code)
  })
})
