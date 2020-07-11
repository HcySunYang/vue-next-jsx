import { resolve } from 'path'
import tsPlugin from 'rollup-plugin-typescript2'
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import globals from 'rollup-plugin-node-globals'

const isPlayground = process.env.TARGET === 'playground'

const commonConfig = {
  plugins: [
    nodeResolve(),
    commonjs(),
    tsPlugin({
      tsconfig: resolve(__dirname, 'tsconfig.json'),
      cacheRoot: resolve(__dirname, 'node_modules/.rts2_cache')
    })
  ],
  onwarn(warning, rollupWarn) {
    if (warning.code !== 'CIRCULAR_DEPENDENCY') {
      rollupWarn(warning)
    }
  }
}
if (isPlayground) {
  commonConfig.plugins.push(globals())
}

const mainConfig = {
  input: 'src/main.ts',
  output: {
    file: 'dist/main.js',
    format: 'cjs'
  },
  ...commonConfig,
  external: ['@babel/plugin-syntax-jsx']
}

const finallyConfigs = [mainConfig]

if (process.env.TARGET === 'playground') {
  finallyConfigs.push({
    input: 'playground/index.ts',
    output: {
      file: resolve(__dirname, './playground/dist/global.js'),
      format: 'iife',
      globals: {
        vue: 'Vue',
        '@babel/core': 'Babel'
      }
    },
    ...commonConfig,
    external: ['vue', '@babel/core']
  })
}

export default finallyConfigs
