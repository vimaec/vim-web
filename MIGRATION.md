# Migration Guide

## vim-web 1.0 beta → DS UI (React removed)

The React UI layer is gone. The UI is now framework-free DOM built on the vim-html-ds design
system, and `three` is vim-web's only peer dependency.

### Namespace

```ts
// Before
const viewer = await VIM.React.Webgl.createViewer(div, settings)
const ultra = await VIM.React.Ultra.createViewer(div, settings)

// After
const viewer = await VIM.Dom.Webgl.createViewer(div, settings)
const ultra = await VIM.Dom.Ultra.createViewer(div, settings)
```

`ViewerApi`, `FramingApi`, `SectionBoxApi`, `IsolationApi`, `RenderSettingsApi`, `viewer.ui`,
`createContainer`, `StateRef` / `FuncRef` / `createState` are unchanged and now live under
`VIM.Dom`. Settings shapes (`WebglSettings`, `UltraSettings`) are unchanged.

### Callbacks that took or returned JSX now use DOM

```ts
// Control bar icons: an Element factory instead of a React component
viewer.controlBar.customize(bar => [...bar, {
  id: 'mine', buttons: [{ id: 'b', tip: 'Mine', icon: VIM.Dom.Icons.checkmark, action: () => {} }]
}])

// Context menu actions take no event
{ id: 'custom', label: 'Custom', enabled: true, action: () => {} }

// BIM info render overrides return an Element; `standard()` renders the default
viewer.bimInfo.onRenderHeaderEntryValue = ({ data, standard }) => {
  const el = standard()
  el.append(' !')
  return el
}

// Message boxes: body / footer / icon accept a string or an Element
viewer.modal.message({ title: 'Hello', body: 'Plain text or an Element', canClose: true })
```

`VIM.React.Icons.*` → `VIM.Dom.Icons.*` (same names; each returns an `SVGSVGElement`).

### Where each React export went

Everything the React namespace exported has a home, except the React components themselves
(`Webgl.ViewerComponent`, `Ultra.ViewerComponent`) — mount a viewer into a div instead.

| React | Dom |
|---|---|
| `React.Webgl.*`, `React.Ultra.*` | `Dom.Webgl.*`, `Dom.Ultra.*`, unchanged but for the components |
| `React.ControlBar.Ids` | `Dom.ControlBar.controlBarIds` |
| `React.ControlBar.IControlBarSection` / `IControlBarButton` | `Dom.ControlBar.ControlBarSection` / `ControlBarButton` |
| `React.ControlBar.Style.buttonDefaultStyle`, … | the string itself, typed by `Dom.ControlBar.ButtonVariant` / `SectionVariant` (`'default'`, `'blue'`, …) |
| `React.ControlBar.ControlBarApi` | `Dom.Webgl.ControlBarApi` |
| `React.ContextMenu.Ids` | `Dom.Panels.contextMenuIds` |
| `React.ContextMenu.IContextMenuButton` / `IContextMenuDivider` | `Dom.Panels.ContextMenuButton` / `ContextMenuDivider`, each now tagged with `type: 'button' | 'divider'` |
| `React.Errors.Style` | `Dom.Errors.style` — lower case, and each helper returns a `Node` instead of JSX |
| `React.Settings.SettingsItem` | `Dom.Generic.GenericCommonEntry` |
| `React.ModalApi`, `ModalProps`, `MessageBoxProps`, `LoadingBoxProps`, `ProgressMode` | `Dom.Modal.*` |
| `React.BimInfoPanelApi`, `Data`, `Section`, `Group`, `Entry`, `DataRender`, `DataCustomization` | `Dom.Bim.*` |
| `React.GenericEntryType`, `GenericTextEntry`, `GenericNumberEntry`, `GenericBoolEntry` | `Dom.Generic.*` |
| `React.IsolationPanel.Ids`, `React.SectionBoxPanel.Ids`, `React.GenericPanelApi` | `Dom.Settings.settingsIds` — see below |

### The isolation and section-box popovers are one Settings view

Both floating panels are sections of the Settings tab now, so the two customization hooks are one.
`viewer.isolationPanel.customize` and `viewer.sectionBoxPanel.customize` become
`viewer.settingsView.customize`, and the two id maps become `Dom.Settings.settingsIds`, which also
names the entries that were only ever string literals.

```ts
// Before
viewer.isolation.showPanel.set(true)
viewer.isolationPanel.customize(entries => {
  const item = entries.find(e => e.id === VIM.React.IsolationPanel.Ids.showGhost)
  if (item && 'label' in item) item.label += ' (custom)'
  return entries.filter(e => e.id !== VIM.React.IsolationPanel.Ids.ghostOpacity)
})

// After
viewer.views.open(VIM.Dom.Settings.SETTINGS_VIEW)
viewer.settingsView.customize(entries => {
  const item = entries.find(e => e.id === VIM.Dom.Settings.settingsIds.showGhost)
  if (item && 'label' in item) item.label += ' (custom)'
  return entries.filter(e => e.id !== VIM.Dom.Settings.settingsIds.ghostOpacity)
})
```

The customization runs each time the view is built, so it always sees the current entries.

### Dependencies

Remove `react` and `react-dom` from your app if vim-web was the only consumer. The `vim-web/style.css`
import is still required; it now contains the design-system tokens and the viewer chrome.

### CSS

Internal class names changed: widgets use the design system's `ds-*` classes and the viewer chrome
uses `vim-ds-*`. The `vim-component` / `vim-gfx` / `vim-ui` container classes are unchanged.

### The chrome's own widgets are no longer exported

The viewer builds its own chrome, and each of those widgets takes options written for that one call
site. Exporting them would freeze those shapes, so `VIM.Dom` now exports the *contracts* a host
customizes through and keeps the factories to itself. What a host reaches for instead:

| Was | Now |
|---|---|
| `Dom.ControlBar.controlBar` | `viewer.controlBar.customize(...)` — the `ControlBar*` types and `controlBarIds` are still exported |
| `Dom.TopBar.topBar`, `modelName`, `webglTopBarContent`, `ultraTopBarContent` | `viewer.topBar.customize(...)`, `TopBar*` types, `topBarIds` |
| `Dom.ViewPanel.viewPanel` | `viewer.views.register/open/close`, `ViewSpec`, `ViewFactory`, `ViewPanelApi` |
| `Dom.Modal.modal`, `formatProgress`, `ultraSuggestion` | `viewer.modal.loading/message/help`, and the `ModalApi` / `*BoxProps` types |
| `Dom.Panels.sidePanel`, `overlay`, `logo`, `axesPanel`, `speedToast`, `restOfScreen`, `contextMenu` | the viewer mounts these; `viewer.ui.logo` / `.axes` / `.topBar` / `.controlBar` / `.bimTree` toggle the optional ones, and the menu is `viewer.contextMenu.customize(...)` with `contextMenuIds` |
| `Dom.Bim.bimPanel`, `bimSearch`, `bimGrouping`, `bimRows`, `bimPresets`, `bimExport` | `viewer.ui.bimTree` for the panel; `Dom.Bim.bimTree` with `toTreeData` / `getElements` to build your own |
| `Dom.Bim.bimInfoPanel`, `createBimInfoApi`, `headerToEntries`, `bodyToEntries` | `viewer.bimInfo` — `Data`, `Entry`, `Group`, `Section`, `DataRender`, `DataCustomization` are still exported |
| `Dom.Settings.settingsPanel`, `settingsView`, `createSettings` | `viewer.views.open(Dom.Settings.SETTINGS_VIEW)` |
| `Dom.State.createWebglState`, `createWebglFraming`, `createUltraIsolation`, `createUiRefs`, … | `viewer.framing`, `viewer.isolation`, `viewer.sectionBox`, `viewer.ui`; `Dom.State.createSettingState` stays |
| `Dom.Webgl.WebglLoader` | `viewer.load()` / `viewer.open()` |
| `Dom.Ultra.updateModal`, `updateProgress` | nothing — the Ultra root wires its own dialog |
| `Dom.Generic.genericPanel`, `Dom.Errors.style` | removed; `genericContent` and the error-message builders remain |

Two additions came with the cut: `Dom.getElements(vim)`, which builds the `AugmentedElement[]` that
`Dom.Bim.toTreeData` takes, and `Dom.Bim`'s tree data model (`BimTreeData`, `BimNode`,
`GroupingColumn`, `SortSetting`, `DEFAULT_GROUPING`) — the types `bimTree`'s options name, which
were not exported before.

---

# vim-web 0.5 → 1.0.0-beta.1

## Install

```bash
npm install vim-web@beta
```

React 18.3+ still works. React 19 is also supported.

## Breaking Changes

### 1. createViewer is now async

```ts
// Before (0.5)
const viewer = VIM.React.Webgl.createViewer(div, settings)

// After (1.0)
const viewer = await VIM.React.Webgl.createViewer(div, settings)
```

Same for Ultra:

```ts
const viewer = await VIM.React.Ultra.createViewer(div, settings)
```

### 2. viewer.settings removed

The `SettingsApi` (`viewer.settings.update()`, `viewer.settings.register()`, `viewer.settings.customize()`) no longer exists.

**For UI visibility toggles**, use `viewer.ui`:

```ts
// Before
viewer.settings.update(s => { s.ui.panelBimTree = false })
viewer.settings.update(s => { s.ui.panelControlBar = false })

// After
viewer.ui.bimTree.set(false)
viewer.ui.controlBar.set(false)

// Subscribe to changes
viewer.ui.axes.onChange.subscribe(visible => { ... })

// Read current state
const showing = viewer.ui.bimTree.get()
```

Available UI controls: `logo`, `controlBar`, `bimTree`, `bimInfo`, `axes`, `performance`, `axesOrthographic`, `axesHome`, `cursorOrbit`, `cursorLookAround`, `cursorPan`, `cursorZoom`, `cameraAuto`, `cameraFrameScene`, `cameraFrameSelection`, `sectioningEnable`, `sectioningFitToSelection`, `sectioningReset`, `sectioningShow`, `sectioningAuto`, `sectioningSettings`, `measureEnable`, `visibilityClearSelection`, `visibilityShowAll`, `visibilityToggle`, `visibilityIsolate`, `visibilityAutoIsolate`, `visibilitySettings`, `miscProjectInspector`, `miscSettings`, `miscHelp`, `miscMaximise`

**For render settings** (outline, selection fill, transparency), use `viewer.renderSettings`:

```ts
// Before
viewer.isolation.outlineEnabled.set(false)
viewer.isolation.selectionFillMode.set('xray')
viewer.isolation.showTransparent.set(false)

// After
viewer.renderSettings.outlineEnabled.set(false)
viewer.renderSettings.selectionFillMode.set('xray')
viewer.renderSettings.showTransparent.set(false)
```

### 3. VimSettings.transparency removed

The load-time `TransparencyMode` option (`'opaqueOnly'`, `'transparentOnly'`, `'allAsOpaque'`, `'all'`) is gone.

```ts
// Before
viewer.load({ url }, { transparency: 'opaqueOnly' })

// After — control at runtime instead
viewer.load({ url })
viewer.renderSettings.showTransparent.set(false)
```

### 4. IsolationSettings.transparency renamed

```ts
// Before
const viewer = await VIM.React.Webgl.createViewer(div, {
  isolation: { transparency: false }
})

// After
const viewer = await VIM.React.Webgl.createViewer(div, {
  isolation: { showTransparent: false }
})
```

### 5. IsolationApi slimmed down

Render-related settings moved out of `IsolationApi`. The isolation API now only handles visibility:

```ts
// These still work on viewer.isolation:
viewer.isolation.showAll()
viewer.isolation.hideSelection()
viewer.isolation.isolateSelection()
viewer.isolation.autoIsolate.set(true)
viewer.isolation.showGhost.set(true)
viewer.isolation.ghostOpacity.set(0.5)

// These moved to viewer.renderSettings:
viewer.renderSettings.showTransparent
viewer.renderSettings.transparentOpacity
viewer.renderSettings.outlineEnabled
viewer.renderSettings.outlineQuality
viewer.renderSettings.outlineThickness
viewer.renderSettings.selectionFillMode
viewer.renderSettings.selectionOverlayOpacity
viewer.renderSettings.showRooms
```

## New Features

### BIM Parameter Preloading

Eliminates the ~300ms delay on the first property query:

```ts
// Option A: at load time
const request = viewer.load({ url }, { prewarmBim: true })

// Option B: manually after load
const vim = await request.getVim()
vim.prewarmBimCache()
```

### Configurable Transparent Opacity

Glass/window opacity was hardcoded at 0.25. Now configurable:

```ts
viewer.materials.transparentOpacity = 0.5
```

### New Element APIs

```ts
// Look up by Revit unique ID
const element = vim.getElementFromUniqueId('abc-123-def')

// Distinguish parsed geometry from loaded geometry
element.hasGeometry  // true after VIM is parsed (instances exist)
element.hasMesh      // true after vim.load() builds the mesh

// React to geometry loading
vim.onGeometryLoaded.subscribe(() => { ... })
```

### Idempotent vim.load()

Safe to call multiple times — clears previous geometry automatically:

```ts
await vim.load()       // loads all
await vim.load()       // clears and reloads (no duplicates)
await vim.load(subset) // clears and loads subset
```

### CSS Import

```ts
// Before — import path depended on bundler setup
import 'vim-web/dist/style.css'

// After — clean named export
import 'vim-web/style.css'
```

### BIM Types Import

```ts
// Type-only import for BIM data types
import type { ... } from 'vim-web/bim'
```

## CSS Changes

All Tailwind utility classes (`vc-flex`, `vc-text-sm`, etc.) have been replaced with semantic CSS classes. If you were targeting vim-web's internal CSS classes in your stylesheets, they have changed. The component structure and `vim-` prefixed classes are stable.

## Peer Dependencies

| | 0.5 | 1.0-beta.1 | 1.0-beta.4 |
|---|---|---|---|
| react | ^18.3.1 | ^18.3.1 \|\| ^19.0.0 | — |
| react-dom | ^18.3.1 | ^18.3.1 \|\| ^19.0.0 | — |
| three | (bundled) | (bundled) | ^0.183 |

`three` is the only peer dependency vim-web has: the React UI went out in the same release, which
the top of this guide covers.

### three is now a peer dependency (1.0.0-beta.4)

Through beta.3, `three` was bundled inside vim-web. As of beta.4 it is a peer dependency the host app must install:

```bash
npm install three @types/three
```

This keeps a single instance of three in your app. Previously an app that already used three ended up with two copies — breaking `instanceof` checks across the boundary (including against `VIM.THREE`), duplicating three's module-level state, and shipping ~1.8 MB twice.

Only the pinned version (`^0.183`) is tested; other three.js versions may work. If your app pins a different three, override the peer range at your own risk — a single shared copy is still preferable to a bundled duplicate.

### IIFE build removed (1.0.0-beta.4)

The `<script>`-tag IIFE bundle (`dist/vim-web.iife.js`) is no longer produced; vim-web now ships as ESM only (`dist/vim-web.js`). If you loaded vim-web through a raw `<script>` tag, switch to an ESM import (a bundler, or `<script type="module">`). Consumers importing through a bundler are unaffected.
