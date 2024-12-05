// vite.config.website.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // The root is the src/pages directory
  plugins: [react()],
  root: 'src/pages',
  base: '/vim-web/', // Ensure the correct base URL for your app
  build: {
    // Source maps are needed for debugging
    sourcemap: true,
    // because the root is we need to make the path relative to the repo
    outDir: '../../docs',
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
