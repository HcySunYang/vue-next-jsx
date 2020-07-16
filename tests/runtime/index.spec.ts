import { buildModifiers } from '../../src/runtime'

describe('JSX runtime', () => {
  test('buildModifiers', () => {
    expect(buildModifiers({ foo: true, bar: true })).toEqual({
      foo: true,
      bar: true
    })
    expect(buildModifiers(['a', 'b'])).toEqual({
      a: true,
      b: true
    })
  })
})
