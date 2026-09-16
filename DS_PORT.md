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

## Dialogs

`dom-viewers/modal/` is the viewer's single dialog. `modal()` keeps the React `Modal`'s three
priority slots (help > message > loading) and shows the top one on a DS modal (`createModal`:
backdrop, head, body, foot, Esc/backdrop/× dismissal, focus trap). Its `ModalApi` is the contract
`webgl/loading.ts` and `ultra/modal.tsx` already drive, so they need no changes. Renders coalesce
to a microtask so rapid progress updates draw once. `renderMessageBox` maps title/icon/body/footer
onto head/body/foot and adds a chevron minimize; `renderLoadingBox` replaces the animated bar (the
envelope forbids animation) with a determinate `ds-bar` for percent progress and a static
`ds-skeleton` otherwise; `renderHelp` shows the quick-controls image. `body`/`icon`/`footer`/`more`
take DOM, not JSX (🔓). The speed toast (`panels/speedToast.ts`) sits on `createToaster`, which
places toasts top-right — the side-panel offset logic is gone.

**DS follow-up:** `createModal` is always dismissible. A loading dialog must not be, so `modal()`
swallows backdrop / Esc at capture phase and hides the × while `canClose` is false. A `closable`
option in the DS would remove the workaround.

## Small panels

`panels/contextMenu.ts` builds its entries from the current selection/visibility each time it
opens and shows them on the DS menu (`createMenu`: body-level, closes on backdrop, Esc and item
click); disabled entries are dropped rather than greyed, as the React menu hid them. It subscribes
to the core's `inputs.onContextMenu` itself and exposes `show()` for the BIM tree. `axesPanel.ts`
adopts the core axes canvas into a chrome square and sizes it with a ResizeObserver; `overlay.ts`
(⚡) and `restOfScreen.ts` are the imperative twins of their React layout helpers; `logo.ts` is the
link. Pure modules still living under `react-viewers/` (`contextMenuIds`, `settings/userBoolean`,
the assets) are deep-imported with a bridge comment and move into this layer at the flip.

## Settings & errors

`settings/settingsPanel.ts` is a filled DS panel over `genericContent`, shown by the side panel. The
settings *builders* (`getIsolationSettings`, `getWebglSettingsContent`, `getUltraSettingsContent`)
are logic that stays; they now return **`GenericCommonEntry[]`** — the control/section/group subset
both layers render identically, defined in `dom-viewers/generic/entries.ts` and re-exported by the
React `genericField.tsx` — so either renderer consumes them without casts. `errors/` holds the DOM
twins of the message-box builders (`webglFileError` and the six Ultra screens) over
`errorText.ts` typography, plus `ultraErrors.ts` (`getErrorMessage`, `getRequestErrorMessage`).
Bodies are structured HTML: no DS organism fits a multi-paragraph message. The React
`serverConnectionError` computed `isLocalUrl(url)` and never used it; the twin drops the dead call.

## Side panel & state

The observable core — `StateRef`, `FuncRef`, `createState` and the non-hook `createFuncRef` — moved
out of the React-importing `reactUtils.ts` into **`src/vim-web/state/observable.ts`**; `reactUtils`
re-exports it (public surface unchanged) and the DS layer imports it directly. `dom-viewers/state/
sideState.ts` is `createSideState`, the framework-neutral twin of `useSideState` (two-deep content
stack, width, hasBim) with an `onChange` event. `panels/sidePanel.ts` follows it: width and `hidden`
track the state, the canvas container's `left` moves with it and the viewport is re-measured; a
`ResizeObserver` on the root clamps the width and re-applies. Resizing is the DS `columnGrip`
(WAI-ARIA separator: drag, arrows, Home/double-click reset) instead of the hand-rolled handle. The
panel has no head of its own — pages (settings, BIM) bring their DS head and pass `side.popContent`
as their `onClose`.

## BIM suite

`dom-viewers/bim/` keeps the React data layer (`bimTreeData`, `bimInfoObject`, `bimInfoVim`,
`helpers/element`) via deep imports and rebuilds the four widgets. **bimTree.ts** runs
`@headless-tree/core` without its React adapter: `createTree` keeps its own state, `setMounted(true)`
enables state updates, `registerElement(scrollBox)` binds the hotkeys, and the `setState` /
`setExpandedItems` / `setSelectedItems` / `setFocusedItem` config hooks schedule a microtask render.
The render is a window: `windowRange()` picks the row span, a recycled pool of `.ds-tree__item` rows
is rebound in place (each row is `registerElement`ed with its item so headless-tree's focus handling
finds it), and the spacer / `translateY` come from the DS virtual scaffold. Visibility is the DS
tri-state check (`visible → on`, `partial → partial`, `hidden → off`). Selection stays two-way:
viewer → tree expands ancestors in one `applySubStateUpdate`, highlights and reveals the last
element; tree → viewer runs click / shift / ctrl exactly as before behind a `treeOrigin` guard that
is cleared in `finally`, since the core echoes the selection synchronously. **bimPanel.ts** composes
the page and docks the info panel in a `heightResizable` `ds-collapse`. **state/webglState.ts** is
`createWebglState`, the twin of `useViewerState` (vim / selection / filtered elements / filter).

## Inventory — ~37 UI units

**Complexity:** ⬜ Trivial · 🟨 Moderate · 🟥 Hard
**Flags:** 🔓 public-API break · ⚡ perf-critical · 🔁 logic mostly stays (de-React only)

### What STAYS (the engine survives the rewrite)

The domain state and data layers are already observable-based, not React. They port by deleting the
React hook bridge and subscribing DS handles directly.

| Layer | Files | Action |
|---|---|---|
| Reactivity bridge | `helpers/reactUtils.ts` (`useStateRef`, `useOnChange`, `useCustomizer`, `useRefresher`) | ✅ The observables (`StateRef`, `FuncRef`, `createState`, `createFuncRef`) now live in `src/vim-web/state/observable.ts`; `reactUtils` re-exports them and keeps only the hooks |
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
| 14 | ✅ | BimPanel (shell) | `bim/bimPanel.tsx` | `ds-panel` + `ds-collapse` | 🟥 | `bim/bimPanel.ts` — DS head ('Project Inspector', × → `side.popContent`); search + tree above, 'Bim Inspector' as a height-resizable `ds-collapse` docked below (the DS grab bar replaces the fixed split and `<hr>`) |
| 15 | ✅ | **BimTree** | `bim/bimTreeHeadless.tsx` | `.ds-tree--virtual` scaffold + DS `windowRange()` + `@headless-tree/core` | 🟥⚡ | `bim/bimTree.ts` — headless-tree in a vanilla host (`setMounted`, `registerElement`, change hooks); rows are a recycled pool placed by `windowRange()`; tri-state `ds-check` replaces the eye toggle; `@tanstack/react-virtual` goes at the flip |
| 16 | ✅ | BimSearch | `bim/bimSearch.tsx` | `ds-search` | 🟨 | `bim/bimSearch.ts` — DS search (icon and × built in), 200 ms debounce, count as `ds-tree__meta` |
| 17 | ✅ | BimInfoPanel | `bim/bimInfoPanel.tsx` | `ds-collapse` body + generic entries | 🟥🔓 | `bim/bimInfoPanel.ts` + `bimInfoEntries.ts` + `bimInfoApi.ts` — `DataRender` returns `Element` (🔓); `createBimInfoApi()` is the plain-object twin of `useBimInfo` |

### E. Panels & overlays

| # | Done | Widget | Source | DS target | Cx | Notes |
|---|:---:|---|---|---|----|---|
| 18 | ✅ | Modal | `panels/modal.tsx` | `ds-modal` | 🟨 | `modal/modal.ts` — same 3-slot priority stack and `ModalApi`; loading is non-dismissible via capture-phase interceptors (DS follow-up) |
| 19 | ✅ | MessageBox | `panels/messageBox.tsx` | `ds-modal` head/body/foot | 🟨 | `modal/messageBox.ts` — title/icon in head, footer in foot, chevron minimize; `body`/`icon`/`footer` take DOM (🔓) |
| 20 | ✅ | ContextMenu | `panels/contextMenu.tsx` | `ds-menu` | 🟨🔓 | `panels/contextMenu.ts` — listens to `inputs.onContextMenu` itself, `show()` for the BIM tree; `customize()` keeps the `ContextMenuApi` contract; `action: () => void` (🔓, no React event) |
| 21 | ✅ | Toast | `panels/toast.tsx` | `ds-toaster` | 🟨 | `panels/speedToast.ts` — DS places toasts top-right; the side-panel offset logic is gone |
| 22 | ✅ | LoadingBox | `panels/loadingBox.tsx` | `ds-bar` (percent) / `ds-skeleton` (indeterminate) | 🟨 | `modal/loadingBox.ts` — the animated bar is out (envelope); `more` takes DOM (🔓); `ultraSuggestion()` |
| 23 | ✅ | Help | `panels/help.tsx` | `ds-modal` | 🟨 | `modal/help.ts` — quick-controls image in the modal body |
| 24 | ✅ | AxesPanel | `panels/axesPanel.tsx` | chrome square + `iconButton` atoms | 🟨 | `panels/axesPanel.ts` — adopts the core axes canvas, ResizeObserver sizes it; ortho/perspective icon swaps on `camera.onSettingsChanged` |
| 25 | ✅ | Logo | `panels/logo.tsx` | `<img>` | ⬜ | `panels/logo.ts` |
| 26 | ✅ | SidePanel | `panels/sidePanel.tsx` | chrome box + DS `columnGrip()` | 🟥 | `panels/sidePanel.ts` on `state/sideState.ts` (`createSideState`, the neutral `useSideState` twin); pages supply their own head/×; the grip is keyboard-accessible |
| 27 | ✅ | RestOfScreen | `panels/restOfScreen.tsx` | layout helper | 🟨 | `panels/restOfScreen.ts` — `left`/`width` from `side.getWidth()`, re-synced on body resize and `update()` |
| 28 | ✅ | **Overlay** | `panels/overlay.tsx` | port as-is (imperative) | 🟨⚡ | `panels/overlay.ts` — verbatim relay, plus the listener cleanup the React version lacked |

### F. Settings

| # | Done | Widget | Source | DS target | Cx | Notes |
|---|:---:|---|---|---|----|---|
| 29 | ✅ | SettingsPanel | `settings/settingsPanel.tsx` | `ds-panel` (`fill`) + `genericContent` | 🟨 | `settings/settingsPanel.ts`; the settings builders are retyped to the shared `GenericCommonEntry` so both layers consume them |

### G. Error screens

| # | Done | Widget | Source | DS target | Cx | Notes |
|---|:---:|---|---|---|----|---|
| 30 | ✅ | Error styling | `errors/errorStyle.tsx`, `errors.ts` | structured HTML, tokens | 🟨 | `errors/errorText.ts` — main/subtitle/lists/bullets and `.ds-link`; no DS organism fits a multi-paragraph message |
| 31 | ✅ | WebGL file error | `errors/webglFileError.tsx` | message box | 🟨 | `errors/errors.ts` |
| 32 | ✅ | Ultra errors (×6) | `ultra/errors/*.tsx` | message box | 🟨 | `errors/errors.ts` + `errors/ultraErrors.ts` (client-state → message mappers) |

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
