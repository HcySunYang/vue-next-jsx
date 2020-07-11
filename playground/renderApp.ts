import { h, reactive, createApp } from 'vue'
import { Options } from '../src/main'

const defaultOptions: Options = {
  optimizate: false,
  source: 'vue'
}

export const pluginOptions = reactive<Options>({
  ...defaultOptions
})

const App = {
  setup() {
    return () => {
      return [
        h('h1', `Vue 3 JSX Explorer`),
        h('div', { id: 'options-wrapper' }, [
          h('div', { id: 'options-label' }, 'Options ↘'),
          h('ul', { id: 'options' }, [
            // source selection
            h('li', { id: 'module-source' }, [
              h('span', { class: 'label' }, 'Source: '),
              h('input', {
                type: 'radio',
                id: 'source-vue',
                name: 'source',
                checked: pluginOptions.source === 'vue',
                onChange() {
                  pluginOptions.source = 'vue'
                }
              }),
              h('label', { for: 'source-vue' }, 'Vue'),
              ' ',
              h('input', {
                type: 'radio',
                id: 'source-runtime-dom',
                name: 'mode',
                checked: pluginOptions.source === '@vue/runtime-dom',
                onChange() {
                  pluginOptions.source = '@vue/runtime-dom'
                }
              }),
              h('label', { for: 'source-runtime-dom' }, 'Runtime Dom')
            ]),

            // optimizate
            h('li', [
              h('input', {
                type: 'checkbox',
                id: 'optimizate',
                name: 'optimizate',
                checked: pluginOptions.optimizate,
                onChange(e: Event) {
                  pluginOptions.optimizate = (e.target as HTMLInputElement).checked
                }
              }),
              h('label', { for: 'optimizate' }, 'Optimizate')
            ])
          ])
        ])
      ]
    }
  }
}

export function renderApp() {
  createApp(App).mount(document.getElementById('header')!)
}
