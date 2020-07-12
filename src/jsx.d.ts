import 'vue'

declare module 'vue' {
  interface InputHTMLAttributes {
    vModel?: any
  }
}
