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
      formats: ['es'],
      entry: resolve(__dirname, 'src/vim-web/index.ts')
    },
    rollupOptions: {
      // three is a peer dependency provided by the host app, never bundled — this keeps a single
      // instance of it in the consuming app. React is gone, so its externals go with it.
      external: ['three', /^three\//],
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
