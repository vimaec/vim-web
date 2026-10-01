# WebGL vs Ultra: Discrepancies and Commonalities

## Overview

WebGL renders locally via Three.js; Ultra streams from a server via WebSocket RPC. This fundamental difference drives most divergence, but shared abstractions keep the React layer consistent where it matters.

---

## What's Well Aligned

| Aspect | Notes |
|--------|-------|
| **Selection** | Both use `ISelection<T>` generic interface from `shared/selection.ts` |
| **Input system** | Both use `IInputHandler` from `shared/input/` |
| **Framing** | Both use `FramingApi` + adapter pattern via `state/cameraState.ts` |
| **Isolation** | Both use `IsolationApi` + `IIsolationAdapter` + `useSharedIsolation()` |
| **Section box** | Both use `SectionBoxApi` + adapter pattern via `state/sectionBoxState.ts` |
| **Event system** | Both use `ISignal`/`ISimpleEvent` from ste-signals |
| **VIM collection** | Both use `VimCollection<T>` |
| **Load pattern** | Both wrap core load with React UI (progress, errors) |
| **Settings** | Both use `useSettings<T>()` + `SettingsApi<T>` |
| **Control bar** | Both use shared builder functions (`controlBarCamera`, `controlBarSectionBox`, `controlBarVisibility`) |
| **Import discipline** | React layer consistently uses barrel imports |

---

## ViewerApi Shape

| Field | WebGL | Ultra | Notes |
|-------|:-----:|:-----:|-------|
| `type` | `'webgl'` | `'ultra'` | Discriminant |
| `container` | ✓ | ✓ | |
| `core` | `Webgl.Viewer` | `Ultra.Viewer` | Different types |
| `load` | ✓ | ✓ | Different signatures |
| `open` | ✓ | ✗ | Load without geometry (WebGL only) |
| `unload` | ✓ | ✓ | |
| `framing` | ✓ | ✓ | |
| `isolation` | ✓ | ✓ | |
| `sectionBox` | ✓ | ✓ | |
| `controlBar` | ✓ | ✓ | |
| `modal` | ✓ | ✓ | |
| `contextMenu` | ✓ | ✗ | WebGL only |
| `bimInfo` | ✓ | ✗ | WebGL only |
| `isolationPanel` | ✓ | ✓ | |
| `sectionBoxPanel` | ✓ | ✓ | |
| `settings` | ✓ | ✓ | |
| `ui` | `WebglUiApi` | `UltraUiApi` | Different observable fields |
| `dispose` | ✓ | ✓ | |

WebGL-only features (contextMenu, bimInfo, open) are intentional — Ultra renders server-side so BIM data and deferred geometry loading aren't available client-side.

---

## Element3D

| Property/Method | WebGL | Ultra | Notes |
|----------------|:-----:|:-----:|-------|
| `vim` | ✓ | ✓ | Different vim types |
| `element` | ✓ | ✓ | Element index |
| `elementId` | ✓ | ✗ | |
| `elementUniqueId` | ✓ | ✗ | |
| `instances` | ✓ | ✗ | |
| `hasGeometry` | ✓ | ✗ | |
| `hasMesh` | ✓ | ✗ | |
| `isRoom` | ✓ | ✗ | |
| `visible` | ✓ | ✓ | |
| `outline` | ✓ | ✓ | |
| `focused` | ✓ | ✗ | |
| `ghosted` | ✗ | ✓ | Ultra-specific state |
| `color` | `THREE.Color` | `THREE.Color` | Same type |
| `getBoundingBox()` | ✓ | ✓ | |
| `getCenter()` | ✓ | ✗ | |
| `getBimElement()` | ✓ | ✗ | No BIM data client-side |
| `getBimParameters()` | ✓ | ✗ | No BIM data client-side |

Ultra elements are intentionally thin — the server owns geometry and BIM data.

---

## Camera

| Capability | WebGL | Ultra |
|-----------|:-----:|:-----:|
| `snap()` / `lerp(duration)` | ✓ | ✓ |
| `frame(target)` | ✓ | ✓ |
| `set(position, target)` | ✓ | ✓ |
| `reset()` | ✓ | ✓ |
| `move()` | ✓ | ✗ |
| `rotate()` | ✓ | ✗ |
| `zoom()` / `zoomTowards()` | ✓ | ✗ |
| `orbit()` / `orbitTowards()` | ✓ | ✗ |
| `lookAt()` / `setTarget()` | ✓ | ✗ |
| `orthographic` | ✓ | ✗ |
| `lockRotation` | ✓ | ✗ |
| `pause()` | ✗ | ✓ |
| `save()` | ✗ | ✓ |

Ultra's camera is minimal because movement commands go through RPC. WebGL has a rich local camera with fluent API.

---

## Discrepancies Worth Noting

### 1. Selection Outline Mechanism

**WebGL:** Direct `outline` boolean property on Element3D.
```typescript
object.outline = state
```

**Ultra:** Bit-flag `VisibilityState` enum manipulated by selection adapter.
```typescript
object.state = state
  ? (HIGHLIGHTED | currentVisibility)
  : (currentVisibility & ~HIGHLIGHTED)
```

Different models for the same user-facing concept.

### 2. Isolation Adapter State Management

**WebGL:** Plain closure variables.
```typescript
let ghost = false
let transparency: 'all' | 'opaque' | 'transparent' = 'all'
```

**Ultra:** `createState()` for ghost flag.
```typescript
const ghost = createState<boolean>(false)
```

Mixed patterns for equivalent adapters.

### 3. Ultra Stub Implementations

The Ultra isolation adapter has placeholder methods that silently do nothing:
```typescript
setTransparency: (enabled) => { console.log("not implemented") }
getShowRooms: () => true
setShowRooms: (show) => { console.log("not implemented") }
```

These make the `IIsolationAdapter` contract misleading — settings are accepted but ignored.

### 4. Camera frame() Return Types

- **WebGL:** `frame()` returns `Promise<void>`
- **Ultra:** `frame()` returns `Promise<Segment | undefined>`

Different return types for the same framing concept.

### 5. UI State Hooks

- `useWebglUiState()` returns `{ ui, refs, uiValues }`
- `useUltraUiState()` returns `{ ui, uiValues }` (no `refs` — no localStorage persistence)

### 6. Control Bar

WebGL has extra sections: measure tool, pointer mode, axes controls.
Ultra omits these (server-side rendering doesn't support client-side measurement).

Both share the builder functions for camera, section box, and visibility — good reuse.

### 7. Core Viewer Interface

| WebGL has | Ultra has instead |
|-----------|-------------------|
| `materials` | (server-side) |
| `gizmos` | (not applicable) |
| | `decoder` (RPC decoding) |
| | `serverUrl`, `connectionState` |
| | `connect()`, `disconnect()` |
| | `sectionBox` (direct property, not gizmo) |

---

## Settings

**WebGL-only settings:**
- `panelBimTree`, `panelBimInfo`, `panelPerformance`, `panelAxes`
- `axesOrthographic`, `axesHome`
- `miscProjectInspector`, `miscMaximise`
- Measure tool section

**Shared settings:**
- `panelLogo`, `panelControlBar`
- `miscSettings`, `miscHelp`
- Camera, cursor, section, visibility control bar sections

---

## Summary

Most discrepancies are **intentional** — Ultra is a thin client that delegates to a server. The shared abstractions (selection, isolation, framing, section box) are well-designed with adapter patterns that absorb the differences.

The **actionable** inconsistencies are:
1. **Stub methods** in Ultra isolation — either implement or narrow the adapter interface
2. **Mixed state patterns** in adapters (closures vs createState)
3. **Camera return types** — `frame()` should return consistent types through the framing API
