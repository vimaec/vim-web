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
  The script `cd`s into the submodule and installs with `--no-save`. **Never run npm with
  `--prefix vim-html-ds`**: it installs *vim-web itself* into the submodule as
  `"vim-web": "file:.."`, rewriting the DS's `package.json` and lockfile.
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

Refinements set by the other atoms:

- **External-change guard** (`input`, `select`): only call the DS setter when the observable's
  value differs from the DS's current value — echoing a user's own keystroke back moves the caret,
  and re-setting an unchanged select value is wasted work.
- **Parent-owned toggles** (`iconButton.on`): accept `StateRef<boolean> | boolean`. A StateRef keeps
  the look in sync; the widget never toggles itself — its owner does, exactly like the React version.
- **Delegated zones** (`tooltipZone`): one handle per container; targets carry `TIP_ATTR`. No
  per-widget wiring.

## Icons

`ds-icon` is a glyph-font span, so the 49 custom SVG icons could not come from the DS. Their
geometry now lives in framework-neutral data, **`src/vim-web/icons/iconData.ts`** — generated once
from the old JSX by `scripts/extract-icons.mjs` (a one-shot; edit the data directly from now on) and
typed by `icons/types.ts`. Two renderers draw it: `icons/svg.ts` (`createIcon` → `SVGSVGElement`)
for the DOM layer, exposed name-for-name as `VIM.Dom.Icons.*`, and `react-viewers/iconRender.tsx`
behind the unchanged `VIM.React.Icons.*` API. The 925-line JSX file became a 35-line binding, and
the two layers cannot drift. Inside a DS icon button pass `className: 'ds-iconbtn__svg'` so the DS
sizes the icon. Note: `iconData` uses `satisfies`, which keeps its 49-member literal type — read
entries through an `IconDef` annotation, not `iconData[name].fill` directly.

## Control bar

`dom-viewers/controlbar/controlBar.ts` renders sections of `iconButton`s keyed by id. There is no
re-render: **`update()`** re-evaluates `enable`/`enabled`/`isOn`/`tip`, mutates existing nodes
(active, dimmed, tip, swapped icon factory) and creates/removes by id — the owner calls it when
the relevant observables change. `customize(fn)` is the same contract as the React
`ControlBarApi`. Clicks dispatch through the latest definition so a customization can swap
actions. Layout (a bottom-centred strip of hairline sections) lives in `dom-viewers/style.css`:
app chrome only, tokens only, `--vw-` prefix for its own.

## Generic panels

`dom-viewers/generic/` renders data-driven settings popovers. `genericPanel()` is a DS panel (title,
close, body — `createPanel` with `fill`) inside a `position: fixed` `.vim-ds-floating` box kept above
its anchor by `helpers/floating.ts` (`floatAbove`, the imperative twin of `useFloatingPanelPosition`;
the pure `computeFloatingPosition` is shared with the React hook). The React "overlay" was only a
`pointer-events: none` positioning layer and is gone. `genericContent()` lays entries out under
`ds-collapse` groups/sections; each control is one of the atoms, and every entry's `state` is
subscribed so `enabled` / `visible` re-sync in place where React re-rendered. Entry rows are app
chrome (`.vim-ds-entry`, label 50% / control) because `ds-setting`'s fixed 170px label column
overflows a 300px popover. `element` / `renderValue` entries take DOM instead of JSX (🔓).

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
| 2 | ✅ | IconButton | `components/IconButton.tsx` | `ds-icon-button` | ⬜ | `iconButton.ts` — custom `Element` icons mount via `.el`; `on` accepts `StateRef \| boolean` |
| 3 | ✅ | Input | `components/Input.tsx` | `ds-input` | ⬜ | `input.ts` — `commit: 'input' \| 'change'`; external-change guard |
| 4 | ✅ | Select | `components/Select.tsx` | `ds-select` | ⬜ | `select.ts` — the DS body-level menu replaces the outside-click logic |
| 5 | ✅ | Tooltip | `components/Tooltip.tsx` | `ds-tooltip` | 🟨 | `tooltip.ts` — `tooltipZone(root)`; targets carry `TIP_ATTR` (`data-ds-tip`) |

### B. Control bar → `ds-toolbar`

| # | Done | Widget | Source | DS target | Cx | Notes |
|---|:---:|---|---|---|----|---|
| 6 | ✅ | ControlBar | `controlbar/controlBar.tsx` | `dom-viewers/controlbar/controlBar.ts` | 🟨 | Keyed `update()` replaces re-render; `customize()` keeps the `ControlBarApi` contract. `ds-toolbar` is a table toolbar (search/segmented/actions), not a fit — sections are flex groups styled in `dom-viewers/style.css` |
| 7 | ✅ | ControlBarButton | `controlbar/controlBarButton.tsx` | `iconButton` atom | 🟨🔓 | `icon: (o?) => Element`; clicks dispatch through the latest definition; state-dependent icon factories are swapped in place |
| 8 | ✅ | ControlBarSection | `controlbar/controlBarSection.tsx` | `.vim-ds-controlbar__section` | ⬜ | `data-variant` (`default`, `blue`) mapped to hairline / accent tokens |

### C. Generic floating panels → `ds-panel` + `ds-field`/`ds-setting`

| # | Done | Widget | Source | DS target | Cx | Notes |
|---|:---:|---|---|---|----|---|
| 9 | ✅ | GenericPanel | `generic/genericPanel.tsx` | `ds-panel` (`fill`) in a fixed `.vim-ds-floating` box | 🟨 | `generic/genericPanel.ts`; `floatAbove()` replaces the overlay + hook; `customize()` keeps the `GenericPanelApi` contract |
| 10 | ✅ | GenericField | `generic/genericField.tsx` | `ds-collapse` groups/sections + app entry rows | 🟨 | `generic/genericContent.ts`; `ds-setting`'s 170px grid does not fit a 300px popover, so rows are chrome CSS (label 50% / control). `enabled`/`visible` re-sync on any entry state change |
| 11 | ✅ | InputNumber | `generic/inputNumber.tsx` | `ds-number` | ⬜ | `components/numberInput.ts`; commit + live scrub both write through |
| 12 | ✅ | IsolationPanel | `panels/isolationPanel.tsx` | composed GenericPanel | 🟨 | `panels/isolationPanel.ts`; same entry ids (`isolationPanelIds`) |
| 13 | ✅ | SectionBoxPanel | `panels/sectionBoxPanel.tsx` | composed GenericPanel | 🟨 | `panels/sectionBoxPanel.ts`; same entry ids (`sectionBoxPanelIds`) |

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
| 33 | ✅ | Icons | `icons.tsx` | `src/vim-web/icons/` + `Dom.Icons` | 🟥🔓 | SVG data extracted to `icons/iconData.ts`; `Dom.Icons.*` returns `SVGSVGElement`, `React.Icons.*` renders the same data. React names stay until the flip — **public break** on removal |

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
