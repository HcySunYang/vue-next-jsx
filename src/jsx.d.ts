import 'vue'

export type VModelModifiers = ObjectVModelModifiers | ArrayVModelModifiers

export type ObjectVModelModifiers = {
  trim?: boolean
  lazy?: boolean
  number?: boolean
}

export type ArrayVModelModifiers = Array<keyof ObjectVModelModifiers>

// Intrinaic vModel
export type IntrinsicVModelArg = [any] | [any, VModelModifiers]

// Component vModel
export type ComponentVModelArg =
  | [any]
  | [any, 'modelValue']
  | [any, 'modelValue', string[]]
  | [any, string]
  | [any, string, string[]]
  | [any, string, Record<string, boolean>]

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

  // Components
  interface ComponentCustomProps {
    vModel: ComponentVModelArg
  }
}
