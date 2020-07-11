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

window.init = () => {
  const monaco = window.monaco

  monaco.editor.defineTheme('my-theme', theme)
  monaco.editor.setTheme('my-theme')

  const persistedState: PersistedState = JSON.parse(
    decodeURIComponent(window.location.hash.slice(1)) ||
      localStorage.getItem('jsxstate') ||
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
    localStorage.setItem('jsxstate', state)
    window.location.hash = encodeURIComponent(state)
    const res = compileCode(src)
    if (res) {
      output.setValue(res)
    }
  }

  const editor = monaco.editor.create(document.getElementById('source')!, {
    value: persistedState.src || `<div>Hello World!</div>`,
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
