/* eslint-disable no-unused-vars */

const {
  scopedPreflightStyles,
  isolateInsideOfContainer,
  isolateOutsideOfContainer,
  isolateForComponents
} = require('tailwindcss-scoped-preflight')

/** @type {import('tailwindcss').Config} */
module.exports = {
  prefix: 'vc-',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      black: '#000',
      white: '#FFF',
      primary: {
        DEFAULT: 'var(--c-primary)',
        green: 'var(--c-primary-green)',
        yellow: 'var(--c-primary-yellow)',
        pink: 'var(--c-primary-pink)',
        royal: 'var(--c-primary-royal)',
        purple: 'var(--c-primary-purple)'
      },
      gray: {
        DEFAULT: 'var(--c-gray)',
        darkest: 'var(--c-darkest-gray)',
        darker: 'var(--c-darker-gray)',
        warm: 'var(--c-dark-gray-warm)',
        cool: 'var(--c-dark-gray-cool)',
        medium: 'var(--c-medium-gray)',
        divider: 'var(--c-gray-divider)',
        zebra: 'var(--c-gray-zebra)',
        light: 'var(--c-light-gray)',
        lighter: 'var(--c-lighter-gray)',
        lightest: 'var(--c-lightest-gray)'
      },
      secondary: {
        DEFAULT: 'var(--c-secondary)',
        green: 'var(--c-secondary-green)',
        yellow: 'var(--c-secondary-yellow)',
        pink: 'var(--c-secondary-pink)',
        royal: 'var(--c-secondary-royal)',
        purple: 'var(--c-secondary-purple)'
      },
      light: {
        blue: 'var(--c-light-blue)',
        green: 'var(--c-light-green)'
      },
      list: {
        DEFAULT: 'var(--c-list-hover)'
      },
      'hover-t40': 'var(--c-hover-t40)',
      'white-t50': 'var(--c-white-t50)',
      overflow: {
        DEFAULT: 'var(--c-overflow)'
      }
    },
    extend: {}
  },
  plugins: [
    /** Makes it so we still tailwind preflight utils, but they only apply to vim-component
     * https://github.com/Roman86/tailwindcss-scoped-preflight
     */
    scopedPreflightStyles({
      isolationStrategy: isolateInsideOfContainer('.vim-component')
    })
  ]
}
