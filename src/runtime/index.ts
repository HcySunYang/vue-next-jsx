export function buildModifiers(modifiers: any) {
  if (Array.isArray(modifiers)) {
    return modifiers.reduce((prev, m) => {
      prev[m] = true
      return prev
    }, {})
  }
  return modifiers
}
