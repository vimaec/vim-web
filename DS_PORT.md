# DS Port — vim-web UI on vim-html-ds, without React

Rebuild the vim-web UI on the [vim-html-ds](https://github.com/vimaec/vim-html-ds) design system
(imperative factory components + `styles/ds.css`), bound directly to the existing framework-agnostic
observables (`StateRef` / `FuncRef` / `ste-signals`). React and its peer dependencies are removed
at the end.

## Strategy — strangler, not big-bang

A parallel React-free layer, `src/vim-web/dom-viewers/`, is built beside `src/vim-web/react-viewers/`.
Widgets are ported one at a time against the **same** observable state and `ViewerApi`. The viewer
switches over only once `dom-viewers` reaches parity; React is deleted last. The app stays runnable
the whole time and every widget is independently verifiable.

## Setup

- `vim-html-ds` is a **git submodule** at `/vim-html-ds` (the same way `vim-renderer` consumes it).
  After cloning: `git submodule update --init`.
- Its `dist/` is gitignored inside the submodule and must be built: **`npm run build:ds`**
  (runs automatically before both `npm run build` and `npm run dev` via `prebuild`/`predev`).
- `tsconfig.json` uses `moduleResolution: "bundler"` — required to resolve the DS's `.js`-extension
  imports (`../dom.js` → `dom.ts`/`.d.ts`). `vite.config.js` aliases `vim-html-ds` to the submodule.
- `bundler` resolution honours three's `exports` map, so every `three/examples/jsm/*` import must
  carry its `.js` extension (`…/postprocessing/Pass.js`, not `…/Pass`). The codebase was normalized
  to this; keep new imports consistent or `tsc` will fail to find the module.
- Import the DS only via `src/vim-web/dom-viewers/ds.ts` (the DS "barrel rule").
- DS components need a `.ds-root` ancestor (box-sizing, selection, links). The mount container adds it.
- `ds.css`'s `:root` declares custom properties only (`--stage-*`, `--vim-*`, `--text-*`, …) — no
  collision with vim-web's `--c-*` tokens, and no page-wide restyling of the React UI during the port.

## Open decisions

- **Web fonts.** `ds.css` declares Manrope + JetBrains Mono via `@font-face`. Vite library mode
  inlines every referenced asset as base64, so the four woff2 files add **~154 KB** to
  `dist/style.css` (~319 KB total) for every consumer. Options: keep as-is (zero config, heavier
  CSS); strip the `@font-face` rules at build time and let hosts opt in to loading the fonts (the DS
  falls back to the system stack, which changes the visual envelope); or emit them as separate
  assets via a plugin (library mode ignores `assetsInlineLimit`). Decide before the first release
  that ships the DS layer.

## Binding pattern (set by `components/checkbox.ts`)

Every widget is a factory `widget(host, opts) => handle`:

1. create the DS node from the observable's current value
2. write user input back into the observable (`onChange → state.set`)
3. subscribe to the observable and push changes into the DS handle (`state.onChange → handle.setX`)
4. `destroy()` unsubscribes, then destroys the DS node

Handles extend the DS `DsHandle` contract (`el`, `destroy`, `setVisible`), so composites track
children with the DS `childScope()` and dispose them in one call. No virtual DOM, no hooks, no
reconciliation — this removes the whole class of React footguns (`useEffect` subscription leaks,
`StateRef`-vs-hooks, Rules of Hooks in adapters) that the current layer documents.

## Inventory — ~37 UI units

**Complexity:** ⬜ Trivial · 🟨 Moderate · 🟥 Hard
**Flags:** 🔓 public-API break · ⚡ perf-critical · 🔁 logic mostly stays (de-React only)

### What STAYS (the engine survives the rewrite)

The domain state and data layers are already observable-based, not React. They port by deleting the
React hook bridge and subscribing DS handles directly.

| Layer | Files | Action |
|---|---|---|
| Reactivity bridge | `helpers/reactUtils.ts` (`useStateRef`, `useOnChange`, `useCustomizer`, `useRefresher`) | Remove hook wrappers; keep the `StateRef`/`FuncRef` observables |
| Observable state | `state/*` | 🔁 keep; strip React from `controlBarState.tsx`, `measureState.tsx` |
| Settings persistence | `settings/*` (state, storage, localStorage, item, keys, anySettings, userBoolean, panelContent) | 🔁 keep |
| BIM data mapping | `bim/bimInfoData.ts`, `bimInfoObject.ts`, `bimInfoVim.ts`, `bimTreeData.ts`, `bimUtils.ts` | 🔁 keep; `bimInfoConvert.tsx` de-React |
| Observers/helpers | `helpers/` cameraObserver, cursor, fullScreenObserver, element, data, utils, loadRequest, requestResult, layout | 🔁 keep; hook-shaped helpers → plain functions |
| Ultra logic | `ultra/` camera, controlBar, isolation, sectionBox, settings, settingsPanel, viewerApi | 🔁 keep |
| WebGL logic | `webgl/` camera, isolation, loading, sectionBox, settings, settingsPanel, inputsBindings, viewerApi, viewerState | 🔁 keep; de-hook `viewerState` |

### A. Primitive components → DS atoms

| # | Done | Widget | Source | DS target | Cx | Notes |
|---|:---:|---|---|---|----|---|
| 1 | ✅ | Checkbox | `components/Checkbox.tsx` | `ds-checkbox` | ⬜ | Pattern-setter — `dom-viewers/components/checkbox.ts` |
| 2 | | IconButton | `components/IconButton.tsx` | `ds-icon-button` | ⬜ | |
| 3 | | Input | `components/Input.tsx` | `ds-input` | ⬜ | |
| 4 | | Select | `components/Select.tsx` | `ds-select` | ⬜ | |
| 5 | | Tooltip | `components/Tooltip.tsx` | `ds-tooltip` | 🟨 | DS model is `data-ds-tip` + `tip.bindAll(root)` |

### B. Control bar → `ds-toolbar`

| # | Done | Widget | Source | DS target | Cx | Notes |
|---|:---:|---|---|---|----|---|
| 6 | | ControlBar | `controlbar/controlBar.tsx` | `ds-toolbar` | 🟨 | Preserve `controlBar.customize()` |
| 7 | | ControlBarButton | `controlbar/controlBarButton.tsx` | `ds-icon-button` + `ds-tooltip` | 🟨🔓 | `icon: () => React.ReactElement` → DS icon — **public break** |
| 8 | | ControlBarSection | `controlbar/controlBarSection.tsx` | toolbar group + `ds-divider` | ⬜ | |

### C. Generic floating panels → `ds-panel` + `ds-field`/`ds-setting`

| # | Done | Widget | Source | DS target | Cx | Notes |
|---|:---:|---|---|---|----|---|
| 9 | | GenericPanel | `generic/genericPanel.tsx` | `ds-panel` | 🟨 | Float positioning; preserve `customize()` |
| 10 | | GenericField | `generic/genericField.tsx` | `ds-field` / `ds-setting` | 🟨 | text→input, number→number, bool→checkbox, select→select |
| 11 | | InputNumber | `generic/inputNumber.tsx` | `ds-number` | ⬜ | |
| 12 | | IsolationPanel | `panels/isolationPanel.tsx` | composed GenericPanel | 🟨 | |
| 13 | | SectionBoxPanel | `panels/sectionBoxPanel.tsx` | composed GenericPanel | 🟨 | |

### D. BIM panel suite

| # | Done | Widget | Source | DS target | Cx | Notes |
|---|:---:|---|---|---|----|---|
| 14 | | BimPanel (shell) | `bim/bimPanel.tsx` | `ds-panel` | 🟥 | Orchestrates tree + search + info |
| 15 | | **BimTree** | `bim/bimTreeHeadless.tsx` | `.ds-tree--virtual` scaffold + DS `windowRange()` + `@headless-tree/core` | 🟥⚡ | `createTree` does not virtualize. The DS ships pure windowing math (`virtual.ts`) and keeps row rendering with the consumer — pair it with `@headless-tree/core` (already a dep); drop `@tanstack/react-virtual`. Prove 10k+ nodes first |
| 16 | | BimSearch | `bim/bimSearch.tsx` | `ds-search` | 🟨 | |
| 17 | | BimInfoPanel | `bim/bimInfoPanel.tsx` | `ds-panel` + `ds-field`/`ds-table` | 🟥🔓 | `onData` / `onRenderHeaderEntryValue` return JSX — **public break**; DOM-returning callbacks |

### E. Panels & overlays

| # | Done | Widget | Source | DS target | Cx | Notes |
|---|:---:|---|---|---|----|---|
| 18 | | Modal | `panels/modal.tsx` | `ds-modal` | 🟨 | |
| 19 | | MessageBox | `panels/messageBox.tsx` | `ds-confirm` / `ds-modal` | 🟨 | |
| 20 | | ContextMenu | `panels/contextMenu.tsx` | `ds-menu` | 🟨🔓 | Preserve `contextMenu.customize()` |
| 21 | | Toast | `panels/toast.tsx` | `ds-toaster` | 🟨 | |
| 22 | | LoadingBox | `panels/loadingBox.tsx` | `ds-skeleton` / `ds-bar` | 🟨 | No dedicated DS progress bar — confirm mapping |
| 23 | | Help | `panels/help.tsx` | `ds-modal` / `ds-panel` | 🟨 | |
| 24 | | AxesPanel | `panels/axesPanel.tsx` | bespoke + `ds-icon` | 🟨 | |
| 25 | | Logo | `panels/logo.tsx` | `ds-icon` / `<img>` | ⬜ | |
| 26 | | SidePanel | `panels/sidePanel.tsx` | `ds-panel` + DS `columnGrip()` | 🟥 | Resizable/collapsible; DS `dom.ts` ships `columnGrip` drag-resize |
| 27 | | RestOfScreen | `panels/restOfScreen.tsx` | layout helper | 🟨 | ResizeObserver → direct layout |
| 28 | | **Overlay** | `panels/overlay.tsx` | port as-is (imperative) | 🟨⚡ | **Not visual** — event relay over the canvas that avoids browser hit-testing 10k+ DOM nodes. Must preserve |

### F. Settings

| # | Done | Widget | Source | DS target | Cx | Notes |
|---|:---:|---|---|---|----|---|
| 29 | | SettingsPanel | `settings/settingsPanel.tsx` | `ds-panel` + `ds-setting` | 🟨 | |

### G. Error screens

| # | Done | Widget | Source | DS target | Cx | Notes |
|---|:---:|---|---|---|----|---|
| 30 | | Error styling | `errors/errorStyle.tsx`, `errors.ts` | `ds-banner`/`ds-empty`/`ds-card` | 🟨 | |
| 31 | | WebGL file error | `errors/webglFileError.tsx` | `ds-banner`/`ds-empty` | 🟨 | |
| 32 | | Ultra errors (×6) | `ultra/errors/*.tsx` | `ds-banner`/`ds-empty` | 🟨 | One template, six screens |

### H. Icon set

| # | Done | Widget | Source | DS target | Cx | Notes |
|---|:---:|---|---|---|----|---|
| 33 | | Icons | `icons.tsx` | `ds-icon` set | 🟥🔓 | `VIM.React.Icons.*` is public, typed `React.ReactElement` — **public break**; full parity |

### I. Structural / bootstrap

| # | Done | Widget | Source | DS target | Cx | Notes |
|---|:---:|---|---|---|----|---|
| 34 | | Container | `container.tsx` | keep; add `.ds-root` to the UI mount | ⬜ | Public type |
| 35 | | WebGL viewer root | `webgl/viewer.tsx` | imperative mount + compose | 🟥 | Replaces the React tree |
| 36 | | Ultra viewer root | `ultra/viewer.tsx` | imperative mount | 🟥 | |
| 37 | | Ultra isolation/modal UI | `ultra/isolationPanel.tsx`, `ultra/modal.tsx` | `ds-panel` / `ds-modal` | 🟨 | |

## Critical path

1. 🟥⚡ **BimTree** (#15) — the one technical unknown; spike large-model perf early.
2. 🔓 **Public-API React leaks** — icons (#33), control-bar icon (#7), BIM-info render overrides (#17),
   context-menu items (#20). These define the consumer break; settle the replacement shapes early.
3. ⚡ **Overlay** (#28) — perf-critical and invisible; port deliberately.

## Order of attack (leaf-up)

Atoms (#1–5) → icons (#33) → control bar (#6–8) → generic panels (#9–13) → modal/toast/errors/settings
(#18–32) → BIM suite (#14–17) → viewer roots (#34–37).
