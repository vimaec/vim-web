# vim-web 1.0.0-beta.1

## ⚠️ Breaking Changes

### API Changes
- **`createViewer` is now async** — Returns `Promise<ViewerApi>` instead of `ViewerApi`
- **`viewer.settings` removed** — Use `viewer.ui` for runtime UI toggles
- **`viewer.renderSettings`** — Outline, selection fill, transparency, and room rendering moved out of `IsolationApi` into a dedicated API
- **`VimSettings.transparency` removed** — The load-time `TransparencyMode` option is gone. Use `viewer.isolation.showTransparent` for runtime control
- **`IsolationSettings.transparency` renamed to `showTransparent`**

### Peer Dependencies
- React `^18.3.1 || ^19.0.0` required (was `^18.3.1`)

---

## ✨ New Features

- **Reactive UI controls** — Every UI panel toggle is now a `StateRef` you can read, write, and subscribe to
- **Configurable transparent opacity** — Glass/window opacity is now adjustable (was hardcoded 0.25)
- **BIM parameter preloading** — `viewer.load({ url }, { prewarmBim: true })` eliminates the first-query delay
- **`vim.load()` is idempotent** — Safe to call multiple times; clears previous geometry automatically
- **`getElementFromUniqueId()`** — Look up elements by Revit unique ID string
- **`hasGeometry` vs `hasMesh`** — `hasGeometry` is true after VIM parsing; `hasMesh` is true after geometry is loaded
- **`onGeometryLoaded` signal** — Fires after `vim.load(subset)` completes
- **Portal-based tooltips** — Consistent styled tooltips everywhere, never clipped by overflow containers
- **Reactive control bar tooltips** — Toggle buttons show contextual tips (e.g. "Disable Section Box" when active)
- **`exports` field in package.json** — `import 'vim-web/style.css'` and `import type { ... } from 'vim-web/bim'`

---

## ⚡ Performance

- **BIM tree virtualization** — Only visible rows are rendered. Handles 100k+ elements smoothly
- **BIM parameter caching** — Entity table columns cached at the Vim level. Per-query cost reduced from ~300ms to <1ms
- **Debounced BIM info panel** — 50ms debounce prevents main thread blocking during rapid selection
- **Tree click optimization** — Selecting in the tree skips the expensive viewer→tree sync loop
- **Camera lerp fix** — `onProgress(1)` now fires before the callback is cleared

---

## 🏗️ Architecture

- **Headless BIM tree** — Replaced `react-complex-tree` with `@headless-tree/react`. Full DOM control, no `!important` overrides, flat item list ready for virtualization
- **Clean tree data model** — String IDs, semantic visibility (`visible` / `partial` / `hidden`), O(1) range lookups, parent-first ordering
- **Extracted tree hooks** — `useBimTree`, `useBimVirtualizer`, `useBimVisibility`, `useBimSelectionSync`, `useBimClickHandler`
- **Native UI components** — Side panel resize and context menu reimplemented without libraries (~30 lines each)
- **Tailwind CSS removed** — All styling uses semantic CSS classes with design tokens
- **No linter/formatter** — ESLint and Prettier removed. TypeScript compiler is the only build gate

---

## 📦 Dependencies

### Removed (11)
react-tooltip · re-resizable · @firefox-devtools/react-contextmenu · react-complex-tree · ste-events · eslint · prettier · @typescript-eslint/* · postcss · tailwindcss · autoprefixer

### Added (3)
@headless-tree/core · @headless-tree/react · @tanstack/react-virtual

### Updated

| Package | From | To |
|---------|------|----|
| React | 18.3 | 19.2 |
| TypeScript | 5.8 | 6.0 |
| Vite | 6.4 | 8.0 |
| Three.js | 0.171 | 0.183 |
| vim-format | 1.0.15-dev.5 | 1.0.16-dev.6 |

### Result
**407 → 133 installed packages (67% reduction)**
