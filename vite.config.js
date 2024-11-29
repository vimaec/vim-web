import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    sourcemap: true,
    lib: {
      formats: ['iife', 'es'],
      entry: resolve(__dirname, 'src/vim-web/vimWebIndex.ts'),
      name: 'VIMReact'
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    },
    minify: false
  },
  define: {
    // Ensure Node.js-like globals are not included
    global: 'undefined'
  },
  optimizeDeps: {
    // Ensure no Node.js polyfills are pre-bundled
    exclude: ['@types/node']
  }
})
