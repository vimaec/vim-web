// vite.config.website.js
import { defineConfig } from 'vite'

export default defineConfig({
  // The root is the src/pages directory
  root: 'src/pages',
  build: {
    // Source maps are needed for debugging
    sourcemap: true,
    // because the root is we need to make the path relative to the repo
    outDir: '../../docs/site',
    emptyOutDir: true,

    // minify: false, Uncomment to help with debugging

    // Keep nice names for assets
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name][extname]'
      }
    }
  }
})
