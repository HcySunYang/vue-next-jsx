import { resolve } from 'path'
import tsPlugin from 'rollup-plugin-typescript2'
import commonjs from '@rollup/plugin-commonjs'

export default {
  input: 'src/main.ts',
  output: {
    file: 'dist/main.js',
    format: 'cjs'
  },
  plugins: [
    commonjs(),
    tsPlugin({
      tsconfig: resolve(__dirname, 'tsconfig.json'),
      cacheRoot: resolve(__dirname, 'node_modules/.rts2_cache')
    })
  ]
}
