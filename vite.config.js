import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    sourcemap: true,
    lib: {
      formats: ['iife', 'es'],
      entry: resolve(__dirname, 'src/component.tsx'),
      name: 'VIMReact'
    },
    rollupOptions: {
      // Make sure to externalize dependencies
      external: ['react', 'react-dom'],
      output: {
        // Provide global variables to use when importing your library
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    },
    // Minify set to true will break the IIFE output
    minify: false
  }
})
