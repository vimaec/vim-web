# WebGL Viewer Improvement Suggestions

## Context

After a thorough exploration of the codebase, this document captures concrete improvement suggestions for the WebGL viewer across two axes: **API quality** (internal and external) and **performance**. Each item references specific files and line numbers.

---

## API IMPROVEMENTS

### External API

#### 4. Camera getters expose mutable internal state
**File:** `camera.ts:220-221`
```typescript
get position () { return this.camPerspective.camera.position }
```
Consumers can accidentally corrupt camera state by mutating the returned `Vector3`. Same for `target` and `matrix`. Should return clones or readonly views.

#### 5. Element3D.visible setter has unconditional side effect
**File:** `element3d.ts:106-117`
The setter always iterates meshes to set `mesh.visible = true` even when the attribute didn't change. The `if(value)` block runs outside the change-detection `if`. Should be inside it.

#### 6. onLoadingUpdate carries no payload
**File:** `vim.ts:236-237`
```typescript
this._factory.add(subset)
this._onUpdate.dispatch()  // no progress info, no "started"/"finished" distinction
```
Consumers can't track loading progress or know what was loaded. Consider dispatching `{ loaded: number, total: number }` or at minimum the subset that was just loaded.

#### 7. Selection.enabled has no change event
**File:** `selection.ts:27`
```typescript
public enabled = true;  // plain boolean, no signal
```
Unlike all other state which uses signals, toggling selection enabled/disabled is invisible to listeners. Should be a `StateRef<boolean>` or at minimum fire an event.

#### 8. Missing batch element queries on Vim
**File:** `vim.ts:135-184`
Only single-element lookups exist (`getElement`, `getElementFromIndex`). No `getElementsFromIndices(indices[])` for batch lookups. Common pattern is looping `getElementFromIndex` hundreds of times.

#### 9. Missing Selection utility methods
**File:** `selection.ts`
No `first()`, `filter(predicate)`, or `forEach(callback)`. Every consumer does `selection.getAll().filter(...)` which allocates a new array.

### Internal API

#### 10. VimMeshFactory creates empty transparent meshes unconditionally
**File:** `vimMeshFactory.ts:52-55`
```typescript
scene.addMesh(this._insertableFactory.createOpaqueFromVim(this.g3d, subset))
scene.addMesh(this._insertableFactory.createTransparentFromVim(this.g3d, subset))
```
Both are always created even if the subset has zero transparent geometry. Creates empty GPU buffers and draw calls.

#### 11. G3dSubset constructor rebuilds Maps on every creation
**File:** `g3dSubset.ts:44-61`
Every `new G3dSubset()` builds a `Map<mesh, instances[]>` and iterates all instances. This constructor runs multiple times during loading: once for the full set, then for `filterByCount` (x2), then for `chunks` (xN), then for `except`. Each time rebuilds the map.

#### 12. InstancedMesh eagerly computes ALL per-instance bounding boxes
**File:** `instancedMesh.ts:31-33`
```typescript
this.boxes = this.computeBoundingBoxes()  // N Box3.clone().applyMatrix4()
```
For a mesh with 1000 instances, this allocates 1000 `Box3` objects upfront. Many are never needed (e.g., if only a few are selected).

#### 13. Scene uses Map for instance->submesh lookup
**File:** `scene.ts:46`
```typescript
private _instanceToMeshes: Map<number, Submesh[]> = new Map()
```
If instance indices are dense (0..N), a flat array would give O(1) lookups vs Map's hash overhead. Worth profiling on large models.

---

## PERFORMANCE IMPROVEMENTS

### Loading / Mesh Building

#### 14. G3dSubset.chunks() uses spread operator in loop
**File:** `g3dSubset.ts:78`
```typescript
currentInstances.push(...instances)  // spread creates temp array each iteration
```
For 100 meshes with 10 instances each, allocates 100 temporary arrays. Use a regular loop or `Array.prototype.push.apply`.

#### 15. InsertableGeometry recomputes full bounding box on every update
**File:** `insertableGeometry.ts:263-267`
```typescript
this.geometry.computeBoundingBox()    // iterates ALL vertices
this.geometry.computeBoundingSphere() // iterates ALL vertices again
```
During progressive loading, each update iterates the entire 4M-vertex buffer even though only a subset was added. Should use incremental bounds (expand existing box with new submesh boxes).

### GPU / Rendering

#### 16. GPU picker creates DataView on every pick
**File:** `gpuPicker.ts:247`
```typescript
const dataView = new DataView(this._readBuffer.buffer)
```
Should be pre-allocated as an instance field since `_readBuffer` never changes.

#### 17. GPU picker allocates Vector3s in reconstructWorldPosition
**File:** `gpuPicker.ts:312-334`
```typescript
const rayEnd = new THREE.Vector3(ndcX, ndcY, 1).unproject(camera)
const cameraDir = new THREE.Vector3()
const worldPos = camera.position.clone().add(rayDir.clone().multiplyScalar(t))
```
Multiple temporary Vector3 allocations per pick. Should use pre-allocated scratch vectors.

#### 18. Element3D._addMesh uses findIndex for duplicate check
**File:** `element3d.ts:253`
```typescript
if (this._meshes.findIndex((m) => m.equals(mesh)) < 0)
```
O(n) linear scan. For elements with many submeshes this adds up. A Set or early-exit would be cheaper.

---

## SUGGESTED PRIORITY ORDER

**Immediate (bugs):**
1. Fix `removeOutline` missing parentheses (element3d.ts:82)
2. Set `debug = false` in gpuPicker (gpuPicker.ts:126)
3. Fix double `getDelta()` in renderingComposer (renderingComposer.ts:230,235)

**High (tangible user/developer impact):**
4. Camera getters return clones
5. Skip empty transparent mesh creation in VimMeshFactory
6. Lazy bounding boxes in InstancedMesh
7. Incremental bounding box in InsertableGeometry.update()
8. Add payload to onLoadingUpdate signal

**Medium (API polish):**
9. Fix visible setter side effect scoping
10. Add batch element queries to Vim
11. Add Selection utility methods (first, filter)
12. Selection.enabled change events

**Lower (micro-optimizations, profile first):**
13. Pre-allocate DataView and scratch Vector3s in gpuPicker
14. Replace spread operator in G3dSubset.chunks()
15. Reduce G3dSubset constructor overhead
16. Array-based instance->submesh lookup in Scene
