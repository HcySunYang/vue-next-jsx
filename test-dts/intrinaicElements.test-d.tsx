import { defineComponent, ref } from 'vue'
import { describe, expectError, expectType } from './index'

describe('vModel', () => {
  defineComponent({
    setup() {
      const refVal = ref('')
      return () => {
        // intrinaic elements
        expectType(<input vModel={[refVal.value]} />)
        expectType(
          <input
            vModel={[
              refVal.value,
              {
                trim: true,
                number: false,
                lazy: true
              }
            ]}
          />
        )
        expectType(
          <input vModel={[refVal.value, ['lazy', 'number', 'trim']]} />
        )

        // @ts-expect-error
        expectError(<input vModel={refVal.value} />)
        // @ts-expect-error
        expectError(<input vModel={[refVal.value, ['a']]} />)
        // @ts-expect-error
        expectError(<input vModel={[refVal.value, { a: true }]} />)

        // value-based elements (components)
        // type a = JSX.ElementAttributesProperty
      }
    }
  })
})
