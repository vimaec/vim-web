---
name: review-core
description: Review core-viewers layer code for issues like leaked internals, incorrect imports, and architectural violations. Use when reviewing core-viewers/ files.
allowed-tools: Read, Grep, Glob
---

# Review Core Viewers Layer

Review the specified files (or scan `src/vim-web/core-viewers/` if none specified) for these issues:

## 1. Import Discipline
- Core files MUST import directly from source files, NEVER through barrel files (index.ts)
- This is the opposite of the React layer rule

## 2. Leaked Internals
- Check what appears in `.d.ts` output for public classes
- `@internal` tagged members still appear in `.d.ts` — prefer `private` keyword
- `readonly` fields with `@internal` are visible to consumers — make them `private`

## 3. Interface-Based API Design
- Gizmo classes should expose interfaces, not concrete types
- Interfaces should only include user-facing methods
- Auto-managed properties (e.g., camera-subscription-driven `show()`/`setPosition()`) should NOT be on interfaces

## 4. Key Architectural Rules

### Viewer
- `Viewer` class fields like `_renderer` and `_viewport` should be `private`
- Gizmos that need renderer/viewport should receive them via constructor injection, not by reaching into `viewer._renderer`

### Rendering
- On-demand rendering via `renderer.needsUpdate` flag
- `renderer.requestRender()` sets the flag; cleared after each frame

### Mesh Building
- ≤5 instances → merged `InsertableMesh` (chunked at 16M indices)
- >5 instances → GPU instanced `InstancedMesh`
- Both delegate material application to shared `applyMaterial()` helper
- Chunk size is 16M **indices** (not vertices) — GPU picking removes raycast traversal constraints

### Color Palette System
- `submeshColor: Uint16Array` — ALWAYS present, maps submesh→colorIndex
- `colorPalette: Float32Array | undefined` — texture with unique colors, undefined if >16,384 unique
- Key files: `colorPalette.ts`, `geometry.ts`, `insertableGeometry.ts`
- No vertex color fallback — palette-only coloring enforced

### Loading Pipeline
- Element3D objects are created **lazily** when first accessed via `vim.getElement()` — not during mesh loading
- `scene.addMesh()` only builds instance→submesh map, does NOT create Element3D
- `Submesh = InsertableSubmesh | InstancedSubmesh` — polymorphic, used by Element3D
- `MergedSubmesh = InsertableSubmesh` (type alias)

### Temp Vector Reuse
- Input handlers and picking material use reusable temp vectors to avoid per-frame GC
- `private static _tempDir = new THREE.Vector3()` pattern — never store references
- Use `.copy()` when storing from a temp vector, never assign the reference

### GPU Picking
- ID packing: `(vimIndex << 24) | elementIndex` as uint32
- `packPickingId()` and `unpackPickingId()` utilities in `gpuPicker.ts`
- Float32 render target: R=packedId, G=depth, B=normal.x, A=normal.y

### Selection
- `ISelectable` is the shared interface for selectable objects
- `IElement3D` extends `ISelectable` with BIM-specific properties
- Selection fires `onSelectionChanged` signal

## 5. Dead Code
- Unused imports, functions, classes
- Console.log statements
- Commented-out code blocks

## Output Format

For each issue: **File:line** | **Category** | **Severity** | **Description** | **Fix**
