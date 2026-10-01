import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    // Same alias the build uses: vim-html-ds is a git submodule, not a node_modules package.
    alias: [
      // vim-html-ds is a git submodule, not a node_modules package — the build aliases it the same way.
      { find: /^vim-html-ds\/(.*)$/, replacement: resolve(__dirname, 'vim-html-ds') + '/$1' },
      // vim-format declares `module: "/dist/index.js"` — a leading slash, which reads as an absolute
      // path from the filesystem root. Vite's build resolves around it; the test resolver does not,
      // so both the package and its deep imports are pointed at the files directly.
      { find: /^vim-format$/, replacement: resolve(__dirname, 'node_modules/vim-format/dist/index.js') },
      { find: /^vim-format\/(.*)$/, replacement: resolve(__dirname, 'node_modules/vim-format') + '/$1' }
    ]
  },
  test: {
    // Tests live beside nothing: `tests/` mirrors `src/vim-web/`, so the declaration build and the
    // published package never see them.
    include: ['tests/**/*.test.ts'],
    // Node by default — only the tests that touch the DOM pay for one, through a file-level
    // `@vitest-environment happy-dom` comment.
    environment: 'node',
    // The UI tests pull in the whole dom-viewers graph; transforming it is most of the run.
    fsModuleCache: true
  }
})
