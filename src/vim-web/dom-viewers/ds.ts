/**
 * Single import point for the vim-html-ds design system.
 *
 * The DS "barrel rule": consumers import only from its barrel, never from
 * internal modules (dom.ts, chart-util.ts). Routing every DS import through
 * this file keeps that rule enforceable and the dist path in one place.
 *
 * The DS is a git submodule at /vim-html-ds; its dist is built by `npm run build:ds`.
 */
export * from 'vim-html-ds/dist/ds.js'
