# VIM Web

React-based 3D viewers for VIM files with BIM (Building Information Modeling) support.

## Quick Reference

### Common Operations

| Task | WebGL | Ultra |
|------|-------|-------|
| **Create viewer** | `VIM.React.Webgl.createViewer(div, settings)` | `VIM.React.Ultra.createViewer(div, settings)` |
| **Load model** | `await viewer.load({ url }).getVim()` | `viewer.load({ url })` |
| **Get element** | `vim.getElementFromIndex(index)` | `vim.getElementFromIndex(index)` |
| **Select** | `viewer.core.selection.select(element)` | `viewer.core.selection.select(element)` |
| **Frame camera** | `viewer.core.camera.lerp(1).frame(element)` | `viewer.core.camera.frame(element)` |
| **Set visibility** | `element.visible = false` | `element.visible = false` |
| **Set color** | `element.color = new THREE.Color(0xff0000)` | `element.color = new RGBA32(0xff0000ff)` |
| **Section box** | `viewer.sectionBox.active.set(true)` | `viewer.sectionBox.active.set(true)` |

### Key File Locations

| Purpose | Path |
|---------|------|
| Main exports | `src/vim-web/index.ts` |
| WebGL React viewer | `src/vim-web/react-viewers/webgl/viewer.tsx` |
| Ultra React viewer | `src/vim-web/react-viewers/ultra/viewer.tsx` |
| WebGL core viewer | `src/vim-web/core-viewers/webgl/viewer/viewer.ts` |
| Ultra core viewer | `src/vim-web/core-viewers/ultra/viewer.ts` |
| Element3D (WebGL) | `src/vim-web/core-viewers/webgl/loader/element3d.ts` |
| Element3D (Ultra) | `src/vim-web/core-viewers/ultra/element3d.ts` |
| Selection | `src/vim-web/core-viewers/shared/selection.ts` |
| Camera | `src/vim-web/core-viewers/webgl/viewer/camera/` |
| Gizmos | `src/vim-web/core-viewers/webgl/viewer/gizmos/` |
| RPC Client (Ultra) | `src/vim-web/core-viewers/ultra/rpcClient.ts` |
| StateRef hooks | `src/vim-web/react-viewers/helpers/reactUtils.ts` |
| GPU Picker | `src/vim-web/core-viewers/webgl/viewer/rendering/gpuPicker.ts` |
| Picking Material | `src/vim-web/core-viewers/webgl/loader/materials/pickingMaterial.ts` |
| InsertableGeometry | `src/vim-web/core-viewers/webgl/loader/progressive/insertableGeometry.ts` |
| InstancedMeshFactory | `src/vim-web/core-viewers/webgl/loader/progressive/instancedMeshFactory.ts` |
| VimMeshFactory | `src/vim-web/core-viewers/webgl/loader/progressive/vimMeshFactory.ts` |
| VimSettings | `src/vim-web/core-viewers/webgl/loader/vimSettings.ts` |
| Mesh types (Submesh) | `src/vim-web/core-viewers/webgl/loader/mesh.ts` |
| Scene | `src/vim-web/core-viewers/webgl/loader/scene.ts` |
| Raycaster (CPU) | `src/vim-web/core-viewers/webgl/viewer/raycaster.ts` |
| InsertableMesh | `src/vim-web/core-viewers/webgl/loader/progressive/insertableMesh.ts` |
| InstancedMesh | `src/vim-web/core-viewers/webgl/loader/progressive/instancedMesh.ts` |
| InsertableMeshFactory | `src/vim-web/core-viewers/webgl/loader/progressive/insertableMeshFactory.ts` |
| ComponentLoader | `src/vim-web/react-viewers/webgl/loading.ts` |
| Core LoadRequest | `src/vim-web/core-viewers/webgl/loader/progressive/loadRequest.ts` |
| G3dSubset | `src/vim-web/core-viewers/webgl/loader/progressive/g3dSubset.ts` |
| G3dMeshOffsets | `src/vim-web/core-viewers/webgl/loader/progressive/g3dOffsets.ts` |
| ElementMapping | `src/vim-web/core-viewers/webgl/loader/elementMapping.ts` |
| Vim | `src/vim-web/core-viewers/webgl/loader/vim.ts` |
| RenderingComposer | `src/vim-web/core-viewers/webgl/viewer/rendering/renderingComposer.ts` |
| Renderer | `src/vim-web/core-viewers/webgl/viewer/rendering/renderer.ts` |

### Import Pattern

```typescript
import * as VIM from 'vim-web'

// Access namespaces
VIM.Core.Webgl.Viewer      // WebGL core
VIM.Core.Ultra.Viewer      // Ultra core
VIM.React.Webgl.createViewer  // React WebGL factory
VIM.React.Ultra.createViewer  // React Ultra factory
VIM.THREE                  // Three.js re-export
```

---

## Tech Stack

- **TypeScript 5.7** (strict mode disabled), **React 18.3**, **Vite 6**
- **Three.js 0.171**, **Tailwind CSS 3.4** (`vc-` prefix)
- **ste-events** for typed events, **vim-format** for BIM data

## Architecture

### Dual Viewer System

| Viewer | Use Case | Rendering |
|--------|----------|-----------|
| **WebGL** | Small-medium models | Local Three.js |
| **Ultra** | Large models | Server-side streaming via WebSocket |

### Layer Separation

```
src/vim-web/
├── core-viewers/           # Framework-agnostic (no React)
│   ├── webgl/              # Local Three.js rendering
│   │   ├── loader/         # Mesh building, scene, VIM data model
│   │   │   ├── progressive/  # Geometry loading & mesh construction
│   │   │   └── materials/    # Shader materials, applyMaterial() helper
│   │   └── viewer/         # Camera, raycaster, rendering, gizmos
│   ├── ultra/              # RPC client for streaming server
│   └── shared/             # Common interfaces (IVim, Selection, Input)
└── react-viewers/          # React UI layer
    ├── webgl/              # Full UI (BIM tree, context menu, gizmos)
    ├── ultra/              # Minimal UI
    └── helpers/            # StateRef, hooks, utilities
```

### ViewerApi (React-to-Core API)

```typescript
// WebGL ViewerApi
type WebglViewerApi = {
  type: 'webgl'
  container: Container       // HTML structure
  core: Core.Webgl.Viewer    // Direct core access
  load: (source, settings?) => IWebglLoadRequest  // Load with geometry + UI
  open: (source, settings?) => IWebglLoadRequest  // Load without geometry
  unload: (vim) => void      // Remove and dispose a vim
  framing: FramingApi         // Framing controls (frame selection/scene)
  sectionBox: SectionBoxApi  // Section box
  isolation: IsolationApi    // Isolation mode
  controlBar: ControlBarApi  // Toolbar customization
  contextMenu: ContextMenuApi
  bimInfo: BimInfoPanelApi
  modal: ModalApi
  settings: SettingsApi
  isolationPanel: GenericPanelApi   // Isolation render settings
  sectionBoxPanel: GenericPanelApi  // Section box offset settings
  dispose: () => void
}

// Ultra ViewerApi (similar but with RPC-based core, no contextMenu/bimInfo)
```

---

## Core Concepts

### Element3D

The primary object representing a BIM element.

```typescript
const element = vim.getElementFromIndex(301)

// Properties
element.vim          // Parent Vim container
element.element      // BIM element index
element.elementId    // Unique ID (bigint)
element.hasMesh      // Has geometry?
element.isRoom       // Is a room?

// Visual state (WebGL)
element.outline = true       // Selection highlight
element.visible = false      // Hide
element.focused = true       // Focus highlight
element.color = new THREE.Color(0xff0000)  // Override color

// Visual state (Ultra)
element.visible = false              // Hide (same as WebGL)
element.outline = true               // Highlight (same as WebGL)
element.state = VisibilityState.GHOSTED  // Advanced: ghosted appearance
element.color = new RGBA32(0xff0000ff)

// Geometry
const box = await element.getBoundingBox()
const center = await element.getCenter()

// BIM data
const bimElement = await element.getBimElement()  // { name, id, categoryIndex, ... }
const params = await element.getBimParameters()   // [{ name, value, group }, ...]
```

### Selection

```typescript
const selection = viewer.core.selection

// Modify
selection.select(element)      // Replace
selection.select([a, b, c])    // Multi-select
selection.add(element)         // Add
selection.remove(element)      // Remove
selection.toggle(element)      // Toggle
selection.clear()              // Clear all

// Query
selection.has(element)         // Is selected?
selection.any()                // Has selection?
selection.count()              // Count
selection.getAll()             // Get all

// Events
selection.onSelectionChanged.subscribe(() => { ... })

// Bounding box
const box = await selection.getBoundingBox()
```

### Camera (WebGL)

Fluent API with `snap()` (instant) and `lerp(duration)` (animated).

```typescript
const camera = viewer.core.camera

// Frame targets
camera.lerp(1).frame(element)           // Animate to frame element
camera.lerp(1).frame('all')             // Frame everything
camera.snap().frame(box)                // Instant frame box

// Movement
camera.lerp(1).orbit(new THREE.Vector2(45, 0))  // Orbit by degrees
camera.lerp(1).orbitTowards(new THREE.Vector3(0, 0, -1))  // Top-down
camera.lerp(1).zoom(1.5)                // Zoom out
camera.lerp(1).zoomTo(point, 0.8)       // Zoom toward point (becomes new orbit target)
camera.snap().set(position, target)     // Set position/target

// State
camera.position                         // Current position
camera.target                           // Look-at target
camera.orthographic = true              // Ortho projection
camera.lockRotation = new THREE.Vector2(0, 0)  // Lock rotation

// Plan view setup
camera.snap().orbitTowards(new THREE.Vector3(0, 0, -1))
camera.lockRotation = new THREE.Vector2(0, 0)
camera.orthographic = true
viewer.core.inputs.pointerMode = VIM.Core.PointerMode.PAN
```

### Gizmos (WebGL)

```typescript
// Section Box
viewer.gizmos.sectionBox.active = true
viewer.gizmos.sectionBox.visible = true
viewer.gizmos.sectionBox.setBox(box)

// Measure Tool
await viewer.gizmos.measure.start()  // Two-click measurement
console.log(viewer.gizmos.measure.measurement.length())
viewer.gizmos.measure.clear()

// Markers
const marker = viewer.gizmos.markers.add(position)
viewer.gizmos.markers.remove(marker)
```

---

## StateRef Pattern

Custom state management in React layer. Critical for customization.

```typescript
// StateRef<T> - Observable state
const state: StateRef<boolean>
state.get()                    // Read
state.set(true)                // Write
state.onChange.subscribe(v => ...)  // Subscribe

// FuncRef<TArg, TReturn> - Callable function reference
const action: FuncRef<void, void>           // No-arg, sync
const query: FuncRef<void, Promise<Box3>>   // No-arg, async
const setter: FuncRef<Box3, void>           // With arg
action.call()                  // Execute
action.update(prev => () => { prev(); doAfter() })  // Wrap with middleware

// In React components
state.useOnChange((v) => ...)  // Hook subscription
state.useMemo((v) => compute(v))
```

---

## Input System

> **📖 Full Documentation**: See [INPUT.md](./.claude/docs/INPUT.md) for architecture, patterns, and advanced customization

### Default Bindings

| Input | Action |
|-------|--------|
| Left Drag | Orbit (or mode-specific) |
| Right Drag | Look |
| Middle Drag | Pan |
| Wheel | Zoom to cursor |
| Click | Select |
| Shift+Click | Add to selection |
| Double-Click | Frame |
| WASD / Arrows | Move camera |
| E / Q | Move up / down |
| Shift | 3x speed boost |
| F | Frame selection |
| Escape | Clear selection |
| P | Toggle orthographic |
| Home | Reset camera |
| +/- | Adjust move speed |

### Quick API Reference

```typescript
const inputs = viewer.core.inputs

// Pointer modes: ORBIT | LOOK | PAN | ZOOM | RECT
inputs.pointerMode = VIM.Core.PointerMode.LOOK
inputs.moveSpeed = 5  // Range: -10 to +10, exponential (1.25^speed)

// Custom key handlers (mode: 'replace' | 'append' | 'prepend')
inputs.keyboard.registerKeyDown('KeyR', 'replace', () => { /* ... */ })
inputs.keyboard.registerKeyUp(['Equal', 'NumpadAdd'], 'replace', () => {
  inputs.moveSpeed++
})

// Custom callbacks (all positions are canvas-relative [0-1])
inputs.mouse.onClick = (pos, ctrl) => { /* ... */ }
inputs.mouse.onDrag = (delta, button) => { /* ... */ }
inputs.touch.onPinchOrSpread = (ratio) => { /* ... */ }
```

### Common Patterns

**Plan View (Top-Down, Pan-Only)**:
```typescript
viewer.core.camera.snap().orbitTowards(new VIM.THREE.Vector3(0, 0, -1))
viewer.core.camera.lockRotation = new VIM.THREE.Vector2(0, 0)
viewer.core.camera.orthographic = true
viewer.core.inputs.pointerMode = VIM.Core.PointerMode.PAN
```

**Custom Tool Mode**:
```typescript
const originalMode = viewer.core.inputs.pointerMode
viewer.core.inputs.pointerMode = VIM.Core.PointerMode.RECT
viewer.core.inputs.mouse.onClick = (pos) => { /* custom logic */ }
// Restore: viewer.core.inputs.pointerMode = originalMode
```

See [INPUT.md](./.claude/docs/INPUT.md) for more patterns, coordinate systems, performance optimization, and debugging techniques

---

## Ultra Viewer

Server-side rendering via WebSocket RPC.

### Connection

```typescript
// States: 'connecting' | 'validating' | 'connected' | 'disconnected' | 'error'
viewer.core.socket.onStatusUpdate.subscribe(state => ...)
```

### Visibility States

```typescript
import VisibilityState = VIM.Core.Ultra.VisibilityState

element.state = VisibilityState.VISIBLE      // 0
element.state = VisibilityState.HIDDEN       // 1
element.state = VisibilityState.GHOSTED      // 2
element.state = VisibilityState.HIGHLIGHTED  // 16
```

### RPC Pattern

```typescript
// Fire-and-forget (input events)
viewer.core.rpc.RPCMouseMoveEvent(pos)

// Request-response (queries)
const hit = await viewer.core.rpc.RPCPerformHitTest(pos)
const box = await viewer.core.rpc.RPCGetAABBForElements(vimIndex, indices)
```

---

## Customization

### Control Bar

```typescript
viewer.controlBar.customize((bar) => [{
  id: 'custom-section',
  buttons: [{
    id: 'my-button',
    tip: 'My Button',
    icon: VIM.React.Icons.checkmark,
    action: () => { /* ... */ }
  }]
}])
```

### Context Menu

```typescript
viewer.contextMenu.customize((menu) => [
  ...menu,  // Keep existing
  {
    id: 'custom',
    label: 'Custom Action',
    enabled: true,
    action: () => { /* ... */ }
  }
])
```

### BIM Info Panel

```typescript
// Modify values
viewer.bimInfo.onRenderHeaderEntryValue = data => <>{data.data.value + " !"}</>

// Add custom data
viewer.bimInfo.onData = data => {
  data.body.push({
    title: 'Custom Section', key: 'custom',
    content: [{ title: 'Group', key: 'g', content: [{ label: 'Field', value: 'Value' }] }]
  })
  return Promise.resolve(data)
}
```

---

## Code Examples

### Basic Setup

```typescript
import * as VIM from 'vim-web'

const viewer = await VIM.React.Webgl.createViewer(containerDiv, {
  isolation: { enabled: 'auto', useGhostMaterial: true }
})

const vim = await viewer.load({ url: 'model.vim' }).getVim()
viewer.framing.frameScene.call()

// Cleanup
viewer.dispose()
```

### Load Local File

```typescript
const file = inputElement.files[0]
const buffer = await file.arrayBuffer()
const vim = await viewer.load({ buffer }).getVim()
viewer.framing.frameScene.call()
```

### Isolate Element

```typescript
const target = vim.getElementFromIndex(301)
vim.getAllElements().forEach(e => e.visible = e === target)
vim.scene.material = [viewer.core.materials.simple, viewer.core.materials.ghost]
```

### Color by Height

```typescript
const box = await vim.getBoundingBox()
for (const e of vim.getAllElements()) {
  if (!e.hasMesh) continue
  const center = await e.getCenter()
  const t = (center.z - box.min.z) / (box.max.z - box.min.z)
  e.color = new VIM.THREE.Color().lerpColors(
    new VIM.THREE.Color(0x0000ff),
    new VIM.THREE.Color(0xff0000),
    t
  )
}
```

### Section Box from Selection

```typescript
const box = await viewer.core.selection.getBoundingBox()
viewer.sectionBox.active.set(true)
viewer.sectionBox.sectionBox.call(box)
```

### Screenshot

```typescript
viewer.core.renderer.requestRender()
viewer.core.renderer.render()
const url = viewer.core.renderer.three.domElement.toDataURL('image/png')
const link = document.createElement('a')
link.href = url
link.download = 'screenshot.png'
link.click()
```

### Access BIM Data

```typescript
viewer.core.selection.onSelectionChanged.subscribe(async () => {
  const elements = viewer.core.selection.getAll().filter(e => e.type === 'Element3D')
  if (!elements.length) return

  const bim = await elements[0].getBimElement()
  console.log(bim.name, bim.id)

  const params = await elements[0].getBimParameters()
  params.forEach(p => console.log(`${p.name}: ${p.value}`))
})
```

### Load Multiple VIMs in a Grid

```typescript
const gridSize = 3
const spacing = 50

for (let row = 0; row < gridSize; row++) {
  for (let col = 0; col < gridSize; col++) {
    const position = new VIM.THREE.Vector3(
      col * spacing - (gridSize - 1) * spacing / 2,
      row * spacing - (gridSize - 1) * spacing / 2,
      0
    )
    viewer.load({ url }, { position })
  }
}
```

---

## Naming Conventions

| Pattern | Usage | Example |
|---------|-------|---------|
| `I` prefix | Interfaces | `IVim`, `ICamera`, `ISelectable` |
| `Api` suffix | React API handles | `ViewerApi`, `FramingApi` |
| `Ref` suffix | Reactive primitives | `StateRef`, `ActionRef` |
| `use` prefix | React hooks | `useStateRef` |
| `vc-` prefix | Tailwind classes | `vc-flex` |
| `--c-` prefix | CSS variables | `--c-primary` |

## Code Style

- Prettier: no semicolons, trailing commas, single quotes
- Index files control module exports
- No test framework configured
- Do not keep deprecated code or backwards-compatibility shims unless explicitly requested

### Import Discipline

- **Core files** (`core-viewers/`): Import directly from source files, never through barrel files (index.ts)
- **React layer** (`react-viewers/`): Import through barrel files (`import * as Core from '../../core-viewers'`), never reach into deep internal paths

## Commands

```bash
npm run dev           # Dev server (localhost:5173)
npm run build         # Production build (vite + tsc declarations + rollup d.ts bundles)
npm run eslint        # Lint
npm run documentation # TypeDoc
```

---

## Architecture Details

### Loading Pipeline (WebGL)

> **📖 Loading Optimization**: See [.claude/optimization.md](./.claude/docs/optimization.md) for geometry building performance, lazy Element3D creation, and profiling techniques

Full call chain from `viewer.load()` to rendered scene:

```
viewer.load(url)
  → ComponentLoader.load() — allocates vimIndex (0-255)
    → Core LoadRequest — parses BFast → G3d + VimDocument + ElementMapping
      → Creates Vim (no geometry yet)
    → initVim() — viewer.add(vim), await vim.load()
      → VimMeshFactory.add(subset) — splits merged vs instanced
        → Scene.addMesh() → addSubmesh() → Element3D._addMesh()
```

**Key steps:**
1. `ComponentLoader` allocates a `vimIndex` (0-255) and creates a `LoadRequest`
2. `LoadRequest.loadFromVim()` parses the BFast container: fetches G3d geometry, creates `G3dMaterial`, parses `VimDocument` (BIM data), builds `ElementMapping` (instance-to-element map), creates `Scene` and `VimMeshFactory`
3. `Vim` is constructed with the factory but **no geometry yet** — geometry is loaded separately via `vim.load()` or `vim.load(subset)`
4. `VimMeshFactory.add()` splits the subset: ≤5 instances → `InsertableMeshFactory` (merged, chunked), >5 → `InstancedMeshFactory` (GPU instanced)
5. `Scene.addMesh()` adds the Three.js mesh to the renderer, applies the scene transform matrix, iterates submeshes, and wires each to its `Element3D` via `addSubmesh()`

**`load()` vs `open()`:** Both parse the VIM file, but only `load()` (via `ComponentLoader`) triggers `vim.load()` to build geometry. `open()` creates a Vim with no meshes — call `vim.load()` or `vim.load(subset)` later.

### Progressive Loading

- `G3dSubset`: A filtered view of G3d instances, grouped by mesh. Supports further filtering by instance count (`filterByCount`), exclusion (`except`), and chunking (`chunks`)
- `vim.subset()`: Returns an `ISubset` of all instances — the starting point for filtering
- `vim.load(subset?)`: Loads geometry for the given subset, or all geometry if omitted. Caller is responsible for not loading the same subset twice
- `G3dSubset.chunks(count)`: Splits a subset into smaller subsets by **index count** threshold (not vertex count)

```typescript
// Load everything
await vim.load()

// Load a filtered subset
const sub = vim.subset().filter('instance', indices)
await vim.load(sub)
```

### Rendering Pipeline (WebGL)

> **📖 Optimization Guide**: See [.claude/RENDERING_OPTIMIZATIONS.md](./.claude/docs/RENDERING_OPTIMIZATIONS.md) for shader optimizations, GLSL3 migration, and performance improvements

Multi-pass compositor:
```
Scene (MSAA) → Selection Mask (mask material) → Outline Pass (depth edge detection) → FXAA → Merge → Screen
```

- On-demand rendering: `renderer.needsUpdate` flag is set by camera movements, selection changes, or visibility changes, and cleared after each frame
- Key files: `rendering/renderer.ts`, `renderingComposer.ts`

### Mesh Building (WebGL)

- **≤5 instances**: Merged into `InsertableMesh` via `InsertableMeshFactory` (chunks at 4M **indices**)
- **>5 instances**: GPU instanced via `InstancedMesh` via `InstancedMeshFactory`
- Key file: `loader/progressive/vimMeshFactory.ts`

**Mesh Type Hierarchy:**
- `Scene.meshes: (InsertableMesh | InstancedMesh)[]` — no abstract `Mesh` wrapper
- `Submesh = InsertableSubmesh | InstancedSubmesh` — polymorphic submesh used by Element3D
- `MergedSubmesh = InsertableSubmesh` — type alias (no `StandardSubmesh`)
- `SimpleInstanceSubmesh` — used only by gizmo markers
- Both `InsertableMesh` and `InstancedMesh` delegate material application to the shared `applyMaterial()` helper in `materials/materials.ts`

**Subset Loading:**
- `Vim.load(subset?)` delegates directly to `VimMeshFactory.add()`
- No intermediate builder or progress signals — `load()` is awaitable

### GPU Picking (WebGL)

GPU-based object picking using a custom shader that renders element metadata to a Float32 render target.

**Render Target Format (RGBA Float32):**
- R = packed uint as float bits via `uintBitsToFloat(vimIndex << 24 | elementIndex)` - supports 256 vims × 16M elements
- G = depth (distance along camera direction, 0 = miss)
- B = normal.x (surface normal X component)
- A = normal.y (surface normal Y component)

Normal.z is reconstructed as: `sqrt(1 - x² - y²)`, always positive since normal faces camera.

**ID Packing:**
- IDs are pre-packed during mesh building using `packPickingId(vimIndex, elementIndex)`
- Format: `(vimIndex << 24) | elementIndex` as uint32
- Shader reads `packedId` attribute directly, outputs via `uintBitsToFloat(packedId)`
- Utility functions in `gpuPicker.ts`: `packPickingId()` and `unpackPickingId()`

**Key Files:**
| File | Purpose |
|------|---------|
| `gpuPicker.ts` | Main picker class, reads render target |
| `pickingMaterial.ts` | Custom shader material |
| `insertableGeometry.ts` | Merged mesh geometry with per-vertex attributes |
| `instancedMeshFactory.ts` | Instanced mesh with per-instance attributes |

**Adding New Data to GPU Picker:**

To add a new attribute to the GPU picker output:

1. **Update `pickingMaterial.ts`** - Add attribute and varying to vertex shader, output in fragment shader:
   ```glsl
   // Vertex shader
   attribute float myAttribute;
   varying float vMyAttribute;
   void main() {
     vMyAttribute = myAttribute;
   }

   // Fragment shader
   varying float vMyAttribute;
   void main() {
     gl_FragColor = vec4(vElementIndex, depth, vMyAttribute, 1.0);
   }
   ```

2. **Update `insertableGeometry.ts`** - For merged meshes (≤5 instances):
   - Add `_myAttribute: THREE.Float32BufferAttribute` field
   - Initialize in constructor: `new THREE.Float32BufferAttribute(offsets.counts.vertices, 1)`
   - Register: `geometry.setAttribute('myAttribute', this._myAttribute)`
   - Set values in `insertFromG3d()` loop: `this._myAttribute.setX(index, value)`
   - Mark for update in `update()`: `this._myAttribute.needsUpdate = true`

3. **Update `instancedMeshFactory.ts`** - For instanced meshes (>5 instances):
   - Add setter method that creates `THREE.InstancedBufferAttribute`
   - Call from `createFromVim()` after mesh creation

4. **Propagate through factory chain:**
   - `VimSettings` → `open.ts` → `VimMeshFactory` → `InsertableMesh`/`InstancedMeshFactory`

5. **Update `gpuPicker.ts`** - Read new channel:
   ```typescript
   const myValue = Math.round(this._readBuffer[2])
   ```

**Vim Index Flow:**
```
VimSettings.vimIndex (set by loader based on viewer.vims.length)
  → loadRequest.ts (loadFromVim)
    → VimMeshFactory
      → InsertableMesh / InstancedMeshFactory
        → InsertableGeometry (per-vertex) / InstancedBufferAttribute (per-instance)
          → pickingMaterial shader → gpuPicker.pick()
```

**CPU Raycaster** (`viewer/raycaster.ts`):
- Fallback raycaster using Three.js intersection tests
- Reads `hit.object.userData.vim` as `InsertableMesh | InstancedMesh`
- Discriminates via `mesh.merged` to call `getSubmeshFromFace()` or `getSubMesh()`

### Ultra RPC Stack

```
RpcSafeClient (validation, batching) → RpcClient (marshaling) → SocketClient (WebSocket)
```

- Binary protocol, little-endian
- Fire-and-forget for input, request-response for queries
- Key files: `rpcSafeClient.ts`, `rpcClient.ts`, `socketClient.ts`

### VimSettings (Load Options)

Settings passed to `viewer.load()` to configure vim transformation and rendering:

```typescript
type VimSettings = {
  position: THREE.Vector3    // Positional offset
  rotation: THREE.Vector3    // XYZ rotation in degrees
  scale: number              // Uniform scale factor
  matrix: THREE.Matrix4      // Override transform (replaces position/rotation/scale)
  transparency: 'all' | 'opaque' | 'transparent'  // What to render
  verboseHttp: boolean       // Enable HTTP logging
}

// Example: Load with offset
viewer.load({ url }, { position: new THREE.Vector3(100, 0, 0) })

// Example: Load rotated and scaled
viewer.load({ url }, { rotation: new THREE.Vector3(0, 0, 45), scale: 2 })
```

### VIM Data Model

| Concept | Description |
|---------|-------------|
| Element | BIM entity with properties |
| Instance | Geometry placement in 3D |
| G3D | Geometry container |
| VimDocument | BIM tables (accessed via `vim.bim`) |

The public API for a loaded VIM is `IWebglVim` (concrete `Vim` class is `@internal`):

```typescript
// Querying elements
vim.getElement(instance)           // Instance → Element3D
vim.getElementFromIndex(element)   // Element index → Element3D
vim.getElementsFromId(id)          // Element ID → Element3D[]
vim.getAllElements()               // All Element3D
vim.bim                            // VimDocument for BIM queries

// Geometry loading
await vim.load()                   // Load all geometry
await vim.load(subset)             // Load filtered subset
vim.subset()                       // Get ISubset for filtering
vim.clear()                        // Remove loaded geometry

// Unloading — do NOT call vim.dispose() directly
viewer.remove(vim)                 // Removes and disposes the vim
```

---

## React Layer Patterns & Gotchas

### StateRef<T> Interface vs Concrete Type

The `StateRef<T>` interface only exposes: `get()`, `set()`, `confirm()`, `onChange`.

The object returned by `useStateRef()` also has: `useOnChange()`, `useValidate()`, `useMemo()` — but these are NOT on the `StateRef<T>` interface type.

If a variable is typed as `StateRef<T>` (e.g., in ViewerState), you cannot call `useOnChange` on it. Use `onChange.subscribe()` in a useEffect instead.

### Subscription Cleanup

ste-signals `.sub()` and `.subscribe()` both return unsubscribe functions. Always return them from useEffect cleanup:

```typescript
// CORRECT
useEffect(() => {
    const unsub = signal.subscribe(() => { ... });
    return unsub
}, []);

// WRONG — leaks subscription
useEffect(() => {
    signal.subscribe(() => { ... });
}, []);
```

### Resource Cleanup Checklist

When writing or reviewing useEffect hooks, ensure cleanup for:
1. `.subscribe()` / `.sub()` — return unsub from effect
2. `ResizeObserver` — call `.disconnect()` in cleanup
3. `setTimeout` — call `clearTimeout()` in cleanup
4. Event listeners — call `removeEventListener()` in cleanup

### Hook Naming Convention

Any function calling React hooks (useState, useEffect, useRef, etc.) MUST be prefixed with `use`. Non-hook helper functions must NOT call hooks.

### Intentional useEffect Without Dependencies

These run every render and are intentional:
- `ReactTooltip.rebuild()` — tooltips need DOM re-scan after changes
- `resizeGfx()` in sidePanel — canvas must resize on every render

State updates should NOT be in depless effects — use `onChange.subscribe` pattern instead.

### IsolationApi Pattern

`IsolationApi` has delegation methods (`hasSelection`, `showAll`, `isolateSelection`, etc.). Consumers call `isolation.showAll()` directly — never expose the internal adapter.

The adapter (`IIsolationAdapter`) is an implementation detail:
- WebGL adapter uses closure variables (`let ghost = false`)
- Ultra adapter also uses closure variables (NOT useStateRef — that would be a Rules of Hooks violation since the adapter factory is not a hook)

### Control Bar Customization

Both viewers apply customization through the hook parameter, not at render time:

```typescript
const controlBar = useControlBar(..., customization)
<ControlBar content={controlBar} />
```
