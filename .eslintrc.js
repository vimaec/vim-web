module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    },
    project: './tsconfig.json' // Include if using type-aware linting
  },
  settings: {
    react: {  
      version: 'detect'
    }
  },
  plugins: ['react', 'react-hooks', '@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking', // Include if using type-aware linting
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier' // Include if integrating Prettier
  ],
  rules: {
    'no-use-before-define': 'off',
  },
  globals: {
    JSX: true
  },
  ignorePatterns: ['postcss.config.js', '.eslintrc.js', 'vite.config.website.js', 'vite.config.libs.js' ]
}
