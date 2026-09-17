import { defineConfig } from 'vite'
import { resolve } from 'path'
export default defineConfig({
  resolve: {
    // vim-html-ds is a git submodule; alias so `vim-html-ds/...` resolves into it (see DS_PORT.md)
    alias: { 'vim-html-ds': resolve(__dirname, 'vim-html-ds') }
  },
  build: {
    sourcemap: true,
    lib: {
      formats: ['iife', 'es'],
      entry: resolve(__dirname, 'src/vim-web/index.ts'),
      name: 'VIM'
    },
    rollupOptions: {
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
