import * as m from 'monaco-editor'
import { renderApp, pluginOptions } from './renderApp'
import { watchEffect } from 'vue'
import theme from './theme'
import { Options } from '../src/main'
import JSXPlugin from '../src/main'
import * as Babel from '@babel/core'
import jsx from '@babel/plugin-syntax-jsx'

declare global {
  interface Window {
    monaco: typeof m
    _deps: any
    init: () => void
  }
}

interface PersistedState {
  src: string
  options: Options
}

const sharedEditorOptions: m.editor.IStandaloneEditorConstructionOptions = {
  fontSize: 14,
  scrollBeyondLastLine: false,
  renderWhitespace: 'selection',
  minimap: {
    enabled: false
  }
}

const STORAGE_KEY = 'jsxstate-0.3.2'

window.init = () => {
  const monaco = window.monaco

  monaco.editor.defineTheme('my-theme', theme)
  monaco.editor.setTheme('my-theme')

  const persistedState: PersistedState = JSON.parse(
    decodeURIComponent(window.location.hash.slice(1)) ||
      localStorage.getItem(STORAGE_KEY) ||
      `{}`
  )

  Object.assign(pluginOptions, persistedState.options)

  let lastSuccessfulCode: string
  function compileCode(source: string): string {
    console.clear()
    try {
      const compileFn = (source: string) => {
        const ret = Babel.transform(source, {
          plugins: [
            jsx,
            [
              JSXPlugin,
              {
                ...pluginOptions
              }
            ]
          ]
        })
        return { code: ret ? ret.code : '' }
      }
      const start = performance.now()
      const { code } = compileFn(source)
      console.log(`Compiled in ${(performance.now() - start).toFixed(2)}ms.`)

      lastSuccessfulCode = code + ''
    } catch (e) {
      lastSuccessfulCode = `/* ERROR: ${e.message} (see console for more info) */`
      console.error(e)
    }
    return lastSuccessfulCode
  }

  function reCompile() {
    const src = editor.getValue()
    // every time we re-compile, persist current state
    const state = JSON.stringify({
      src,
      options: pluginOptions
    } as PersistedState)
    localStorage.setItem(STORAGE_KEY, state)
    window.location.hash = encodeURIComponent(state)
    const res = compileCode(src)
    if (res) {
      output.setValue(res)
    }
  }

  const editor = monaco.editor.create(document.getElementById('source')!, {
    value:
      persistedState.src ||
      `<>
    <h1>The 1:1 mapping syntax, it reduces the mental burden, recommended for users who use js:</h1>
    
    <input v-model_number={ refVal.value } />
    <input v-on-click_stop={ handler } />

    <p>You can still use the original jsx syntax:</p>
    <div onClick={ hander }></div>


    <h1>Better type hinting and type safety, recommended to typescript users</h1>

    <input vModel={ [refVal.value, { number: true }] } />
    <input vModel={ [refVal.value, ['number']] } />
    <input vModel={ [refVal.value, modifiers] } />

    <Comp vModel={ [refVal.value, 'foo', { a: true }] } />
    <Comp vModel={ [refVal.value, 'foo', ['a']] } />
    <Comp vModel={ [refVal.value, dynamic, ['a']] } />
    <Comp vModel={ [refVal.value, dynamic, modifiers] } />

    <p>withModifiers:</p>
    <div onClick={ withModifiers(handler, ['self']) }></div>
</>`,
    language: 'html',
    ...sharedEditorOptions,
    wordWrap: 'bounded'
  })

  editor.getModel()!.updateOptions({
    tabSize: 2
  })

  const output = monaco.editor.create(document.getElementById('output')!, {
    value: '',
    language: 'javascript',
    readOnly: true,
    ...sharedEditorOptions
  })
  output.getModel()!.updateOptions({
    tabSize: 2
  })

  // handle resize
  window.addEventListener('resize', () => {
    editor.layout()
    output.layout()
  })

  // update compile output when input changes
  editor.onDidChangeModelContent(debounce(reCompile))

  renderApp()
  watchEffect(reCompile)
}

function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): T {
  let prevTimer: number | null = null
  return ((...args: any[]) => {
    if (prevTimer) {
      clearTimeout(prevTimer)
    }
    prevTimer = window.setTimeout(() => {
      fn(...args)
      prevTimer = null
    }, delay)
  }) as any
}
