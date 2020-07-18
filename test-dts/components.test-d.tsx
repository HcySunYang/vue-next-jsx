import { defineComponent, ref } from 'vue'
import { describe, expectType } from './index'

describe('vModel', () => {
  const Comp = defineComponent({
    props: { foo: String }
  })

  defineComponent({
    setup() {
      const refVal = ref('')
      const arrayModifiers = ['a', 'b']
      const objModifiers = { a: true, b: true }
      const refDynamic = ref('')
      return () => {
        expectType(<Comp vModel={[refVal.value]} />)
        expectType(<Comp vModel={[refVal.value, 'modelValue']} />)
        expectType(<Comp vModel={[refVal.value, 'modelValue', ['a', 'b']]} />)
        expectType(
          <Comp vModel={[refVal.value, 'modelValue', { a: true, b: true }]} />
        )

        expectType(<Comp vModel={[refVal.value, 'foo']} />)
        expectType(<Comp vModel={[refVal.value, 'foo', ['a', 'b']]} />)
        expectType(
          <Comp vModel={[refVal.value, 'foo', { a: true, b: true }]} />
        )

        expectType(<Comp vModel={[refVal.value, 'bar', arrayModifiers]} />)
        expectType(<Comp vModel={[refVal.value, 'bar', objModifiers]} />)

        expectType(<Comp vModel={[refVal.value, refDynamic.value]} />)
      }
    }
  })
})
