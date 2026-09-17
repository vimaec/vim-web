// Fixes image import errors in typecript.

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

declare module '*.css' {
  const value: string
  export default value
}
