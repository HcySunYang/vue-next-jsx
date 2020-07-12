import 'vue'

// type of modifiers
export type IntrinaicVModelModifiers =
  | IntrinaicObjectVModelModifiers
  | IntrinaicArrayVModelModifiers

export type IntrinaicObjectVModelModifiers = {
  trim?: boolean
  lazy?: boolean
  number?: boolean
}

export type IntrinaicArrayVModelModifiers = Array<
  keyof IntrinaicObjectVModelModifiers
>

// value modifiers
export type IntrinsicVModelArg = [any] | [any, IntrinaicVModelModifiers]

declare module 'vue' {
  interface InputHTMLAttributes {
    vModel?: IntrinsicVModelArg
  }
  interface SelectHTMLAttributes {
    vModel?: IntrinsicVModelArg
  }
  interface TextareaHTMLAttributes {
    vModel?: IntrinsicVModelArg
  }
}
