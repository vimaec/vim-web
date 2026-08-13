import { defineConfig } from 'vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,
    lib: {
      formats: ['es'],
      entry: resolve(__dirname, 'src/vim-web/index.ts')
    },
    rollupOptions: {
      // react, react-dom and three are peer dependencies provided by the host app,
      // never bundled — this keeps a single instance of each in the consuming app.
      external: ['react', 'react-dom', /^react\//, /^react-dom\//, 'three', /^three\//],
      output: {
        // Keep style.css name
        assetFileNames: (assetInfo) => {
          if (assetInfo.names[0] === 'vim-web.css') {
            return 'style.css'; // Keep name
          }
          return assetInfo.names[0];
        },
      }
    },
    minify: false
  }
})
