module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: ['standard'],
  overrides: [],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: ['react'],
  rules: {},
  globals: {
    JSX: true
  }
}
