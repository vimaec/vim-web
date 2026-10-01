import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    // Same alias the build uses: vim-html-ds is a git submodule, not a node_modules package.
    alias: { 'vim-html-ds': resolve(__dirname, 'vim-html-ds') }
  },
  test: {
    // Tests live beside nothing: `tests/` mirrors `src/vim-web/`, so the declaration build and the
    // published package never see them.
    include: ['tests/**/*.test.ts'],
    // Node by default — only the tests that touch the DOM pay for one, through a file-level
    // `@vitest-environment happy-dom` comment.
    environment: 'node'
  }
})
