import { defineComponent } from 'vue'
import { describe } from './index'

describe('test', () => {
  defineComponent({
    setup() {
      function handler() {}

      return () => <input vModel={handler} />
    }
  })
})
