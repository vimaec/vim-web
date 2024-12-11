import { defineConfig } from 'vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,
    lib: {
      formats: ['iife', 'es'],
      entry: resolve(__dirname, 'src/vim-web/index.ts'),
      name: 'VIMReact'
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        // Save react and react-dom as globals so they can be provided as external dependencies
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        },

        // Keep style.css name
        assetFileNames: (assetInfo) => {
          console.log(assetInfo)
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
