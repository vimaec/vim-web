// Fixes import errors for non-code modules in TypeScript.

declare module '*.css' {
  const value: any
  export default value
}

declare module '*.png' {
  const value: any
  export = value
}

declare module '*.jpg' {
  const value: any
  export = value
}

declare module '*.svg' {
  const value: any
  export = value
}
