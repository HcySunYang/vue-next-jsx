import { transform, BabelFileResult } from '@babel/core'
import VueNextJSX from '../src/main'

export function transformWithPlugin(source: string) {
  const { code } = transform(source, {
    plugins: [VueNextJSX]
  }) as BabelFileResult
  // expect(typeof code == 'string').toBe(true)
  expect(code).toMatchSnapshot()
}
