# Migration Guide

## vim-web 1.0 beta → DS UI (React removed)

The React UI layer is gone. The UI is now framework-free DOM built on the vim-html-ds design
system, and vim-web has **no peer dependencies** besides `three`.

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

### Dependencies

Remove `react` and `react-dom` from your app if vim-web was the only consumer. The `vim-web/style.css`
import is still required; it now contains the design-system tokens and the viewer chrome.

### CSS

Internal class names changed: widgets use the design system's `ds-*` classes and the viewer chrome
uses `vim-ds-*`. The `vim-component` / `vim-gfx` / `vim-ui` container classes are unchanged.

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

| | 0.5 | 1.0-beta.1 | DS UI |
|---|---|---|---|
| react | ^18.3.1 | ^18.3.1 \|\| ^19.0.0 | — |
| react-dom | ^18.3.1 | ^18.3.1 \|\| ^19.0.0 | — |
