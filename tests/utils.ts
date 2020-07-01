import { transform, BabelFileResult } from '@babel/core'
import VueNextJSX, { Options } from '../src/main'

export function transformWithPlugin(source: string, opts: Options = {}) {
  const { code } = transform(source, {
    plugins: [[VueNextJSX, opts]]
  }) as BabelFileResult
  // expect(typeof code == 'string').toBe(true)
  expect(code).toMatchSnapshot()
}
