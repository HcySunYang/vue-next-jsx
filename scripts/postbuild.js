const fse = require('fs-extra')
const { readFileSync, writeFileSync } = require('fs')
const { resolve } = require('path')
const pkg = require('../package.json')

const resolveRoot = (...p) => resolve(__dirname, '../', ...p)

async function run() {
  await fse.remove(resolveRoot('./dist/src'))
  await fse.remove(resolveRoot('./dist/playground'))
  await fse.remove(resolveRoot('./dist/test-dts'))

  // concat dts file
  const existing = readFileSync(resolveRoot(pkg.types), 'utf-8')
  const jsxDTS = readFileSync(resolveRoot('./src/jsx.d.ts'), 'utf-8')

  writeFileSync(resolveRoot(pkg.types), existing + '\n\n' + jsxDTS, 'utf-8')

  console.info('dts file writing completed!')
}

run()
