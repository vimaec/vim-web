# VIM Web

React-based 3D viewers for VIM files with BIM (Building Information Modeling) support.

## Quick Reference

### Common Operations

| Task | WebGL | Ultra |
|------|-------|-------|
| **Create viewer** | `VIM.React.Webgl.createViewer(div, settings)` | `VIM.React.Ultra.createViewer(div, settings)` |
| **Load model** | `viewer.loader.open({ url }, {})` then `viewer.loader.add(vim)` | `viewer.load({ url })` |
| **Get element** | `vim.getElementFromIndex(index)` | `vim.getElementFromIndex(index)` |
| **Select** | `viewer.core.selection.select(element)` | `viewer.core.selection.select(element)` |
| **Frame camera** | `viewer.core.camera.lerp(1).frame(element)` | `viewer.camera.frame.call(element)` |
| **Set visibility** | `element.visible = false` | `element.state = VisibilityState.HIDDEN` |
| **Set color** | `element.color = new THREE.Color(0xff0000)` | `element.color = new RGBA32(0xff0000ff)` |
| **Section box** | `viewer.sectionBox.enable.set(true)` | `viewer.sectionBox.enable.set(true)` |

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
| VimMeshFactory | `src/vim-web/core-viewers/webgl/loader/progressive/legacyMeshFactory.ts` |

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
│   ├── ultra/              # RPC client for streaming server
│   └── shared/             # Common interfaces (IVim, Selection, Input)
└── react-viewers/          # React UI layer
    ├── webgl/              # Full UI (BIM tree, context menu, gizmos)
    ├── ultra/              # Minimal UI
    └── helpers/            # StateRef, hooks, utilities
```

### ViewerRef (React-to-Core API)

```typescript
// WebGL ViewerRef
type ViewerRef = {
  core: Core.Webgl.Viewer    // Direct core access
  loader: ComponentLoader    // Load VIM files
  camera: CameraRef          // Camera controls
  sectionBox: SectionBoxRef  // Section box
  isolation: IsolationRef    // Isolation mode
  controlBar: ControlBarRef  // Toolbar customization
  contextMenu: ContextMenuRef
  bimInfo: BimInfoPanelRef
  modal: ModalHandle
  settings: SettingsRef
  dispose: () => void
}

// Ultra ViewerRef (similar but with RPC-based core)
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
element.state = VisibilityState.HIDDEN
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
camera.snap().set(position, target)     // Set position/target

// State
camera.position                         // Current position
camera.target                           // Look-at target
camera.orthographic = true              // Ortho projection
camera.allowedRotation = new THREE.Vector2(0, 0)  // Lock rotation

// Plan view setup
camera.snap().orbitTowards(new THREE.Vector3(0, 0, -1))
camera.allowedRotation = new THREE.Vector2(0, 0)
camera.orthographic = true
viewer.core.inputs.pointerActive = VIM.Core.PointerMode.PAN
```

### Gizmos (WebGL)

```typescript
// Section Box
viewer.gizmos.sectionBox.clip = true
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

// ActionRef - Callable action with middleware
const action: ActionRef
action.call()                  // Execute
action.prepend(() => before()) // Add pre-hook
action.append(() => after())   // Add post-hook

// In React components
state.useOnChange((v) => ...)  // Hook subscription
state.useMemo((v) => compute(v))
```

---

## Input Bindings

| Input | Action |
|-------|--------|
| Left Drag | Orbit (or mode-specific) |
| Right Drag | Look |
| Middle Drag | Pan |
| Wheel | Zoom |
| Click | Select |
| Shift+Click | Add to selection |
| Double-Click | Frame |
| WASD | Move camera |
| F | Frame selection |
| Escape | Clear selection |
| P | Toggle orthographic |
| Home | Reset camera |

```typescript
// Register custom key handler
viewer.core.inputs.keyboard.registerKeyDown('KeyR', 'replace', () => {
  // Custom action on R key
})
```

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

const vim = await viewer.loader.open({ url: 'model.vim' }, {})
viewer.loader.add(vim)
viewer.camera.frameScene.call()

// Cleanup
viewer.dispose()
```

### Load Local File

```typescript
const file = inputElement.files[0]
const buffer = await file.arrayBuffer()
viewer.modal.loading({ progress: -1, message: 'Loading...' })
try {
  const vim = await viewer.loader.open({ buffer }, {})
  viewer.loader.add(vim)
} finally {
  viewer.modal.loading(undefined)
  viewer.camera.frameScene.call()
}
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
viewer.sectionBox.enable.set(true)
viewer.sectionBox.sectionBox.call(box)
```

### Screenshot

```typescript
viewer.core.renderer.needsUpdate = true
viewer.core.renderer.render()
const url = viewer.core.renderer.renderer.domElement.toDataURL('image/png')
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

---

## Naming Conventions

| Pattern | Usage | Example |
|---------|-------|---------|
| `I` prefix | Interfaces | `IVim`, `ICamera` |
| `Ref` suffix | Reference types | `StateRef`, `ViewerRef` |
| `use` prefix | React hooks | `useStateRef` |
| `vc-` prefix | Tailwind classes | `vc-flex` |
| `--c-` prefix | CSS variables | `--c-primary` |

## Code Style

- Prettier: no semicolons, trailing commas, single quotes
- Index files control module exports
- No test framework configured
- Do not keep deprecated code or backwards-compatibility shims unless explicitly requested

## Commands

```bash
npm run dev           # Dev server (localhost:5173)
npm run build         # Production build
npm run eslint        # Lint
npm run documentation # TypeDoc
```

---

## Architecture Details

### Rendering Pipeline (WebGL)

```
Main Scene (MSAA) → Selection Mask → Outline Pass → FXAA → Merge → Screen
```

- On-demand rendering: `renderer.needsUpdate = true`
- Key files: `rendering/renderer.ts`, `renderingComposer.ts`

### Mesh Building (WebGL)

- **≤5 instances**: Merged into `InsertableMesh` (chunks at 4M vertices)
- **>5 instances**: GPU instanced via `InstancedMesh`
- Key file: `loader/progressive/legacyMeshFactory.ts`

### GPU Picking (WebGL)

GPU-based object picking using a custom shader that renders element metadata to a Float32 render target.

**Render Target Format (RGBA Float32):**
- R = packed uint as float bits via `uintBitsToFloat(vimIndex << 24 | elementIndex)` - supports 256 vims × 16M elements
- G = depth (distance along camera direction, 0 = miss)
- B = normal.x (surface normal X component)
- A = normal.y (surface normal Y component)

Normal.z is reconstructed as: `sqrt(1 - x² - y²)`, always positive since normal faces camera.

**ID Packing/Unpacking:**
```glsl
// Shader (GLSL 3.0): pack as uint, reinterpret bits as float
uint packedId = (uint(vimIndex) << 24u) | uint(elementIndex);
float packedIdFloat = uintBitsToFloat(packedId);
```
```typescript
// JavaScript: reinterpret float bits back to uint
const dataView = new DataView(readBuffer.buffer)
const packedId = dataView.getUint32(0, true) // little-endian
const vimIndex = packedId >>> 24
const elementIndex = packedId & 0xFFFFFF
```

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
   - For vimx: `VimSettings` → `open.ts` → `VimxSubsetBuilder` → `SubsetRequest`

5. **Update `gpuPicker.ts`** - Read new channel:
   ```typescript
   const myValue = Math.round(this._readBuffer[2])
   ```

**Vim Index Flow:**
```
VimSettings.vimIndex (set by loader based on viewer.vims.length)
  → open.ts (loadFromVim / loadFromVimX)
    → VimMeshFactory / VimxSubsetBuilder
      → InsertableMesh / InstancedMeshFactory / SubsetRequest
        → InsertableGeometry (per-vertex) / InstancedBufferAttribute (per-instance)
          → pickingMaterial shader → gpuPicker.pick()
```

### Ultra RPC Stack

```
RpcSafeClient (validation, batching) → RpcClient (marshaling) → SocketClient (WebSocket)
```

- Binary protocol, little-endian
- Fire-and-forget for input, request-response for queries
- Key files: `rpcSafeClient.ts`, `rpcClient.ts`, `socketClient.ts`

### VIM Data Model

| Concept | Description |
|---------|-------------|
| Element | BIM entity with properties |
| Instance | Geometry placement in 3D |
| G3D | Geometry container |
| VimDocument | BIM tables (accessed via `vim.bim`) |

```typescript
vim.getElement(instance)           // Instance → Element3D
vim.getElementFromIndex(element)   // Element index → Element3D
vim.getElementsFromId(id)          // Element ID → Element3D[]
vim.getAllElements()               // All Element3D
vim.bim                            // VimDocument for BIM queries
```
