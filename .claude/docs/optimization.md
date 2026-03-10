# VIM Loading Performance

How the WebGL loading pipeline works and how to profile it.

## Loading Phases

VIM file loading consists of four sequential phases:

1. **Network/Parsing** - Fetch and parse BFast container (G3d geometry, VimDocument, ElementMapping)
2. **Geometry Building** - Create Three.js meshes from G3d data (primary optimization target)
3. **GPU Upload** - Transfer geometry buffers to GPU
4. **Rendering** - First frame render

## Mesh Building Pipeline

```
VimMeshFactory.add(G3dSubset)
  |-- Split by instance count: <=5 instances -> merged, >5 -> instanced
  |-- Merged path (InsertableMeshFactory)
  |   |-- G3dSubset.chunks(16M indices) -- chunk large meshes
  |   |-- Create InsertableMesh per chunk
  |   |-- insertFromG3d() -- bake matrices, build geometry
  |   +-- scene.addMesh() -- register submeshes
  +-- Instanced path (InstancedMeshFactory)
      |-- Create THREE.InstancedMesh per unique geometry
      |-- setMatrices() -- GPU instancing matrices
      +-- scene.addMesh() -- register submeshes
```

**Chunk Size**: 16M indices (not vertices) per merged mesh. This threshold was chosen because GPU picking eliminates the need for CPU raycast traversal, removing the constraint that kept chunk sizes small.

## Current Performance Patterns

### Lazy Element3D Creation

Element3D objects are **not** created during mesh loading. When `scene.addMesh()` is called, it only builds an `instance -> submesh[]` map. Element3D objects are created lazily on first access via `vim.getElement()` or `vim.getElementFromIndex()`.

This avoids constructing thousands of full Element3D objects during the loading hot path when most will never be accessed.

**Key file**: `src/vim-web/core-viewers/webgl/loader/scene.ts` -- `registerSubmesh()` only populates `_instanceToMeshes`.

### Buffer Reuse in Hot Loops

In `InsertableGeometry.insertFromG3d()`, which iterates over every vertex and index in merged meshes:

- **Matrix buffer**: A single `Float32Array(16)` is allocated once outside the per-instance loop, then reused for each instance's transform matrix. This avoids per-instance allocation in a loop that runs thousands of times.
- **Color index hoisting**: The `submeshColor` lookup (`g3d.submeshColor[sub]`) is hoisted out of the inner per-index loop and computed once per submesh.
- **Direct array access**: Typed array references (`indices`, `submeshIndices`) are assigned once outside loops to avoid repeated property lookups.

**Key file**: `src/vim-web/core-viewers/webgl/loader/progressive/insertableGeometry.ts`

### Color Palette System

The color palette optimization reduces GPU memory by replacing per-vertex color attributes with a texture-based lookup. It is **always enabled**.

Two components:
1. **`submeshColor: Uint16Array`** - Always present. Maps each submesh index to a color palette index.
2. **`colorPalette: Float32Array | undefined`** - A flat RGB array of unique colors, used as a texture. Set to `undefined` only if the model exceeds 16,384 unique colors (128x128 texture limit).

If a model has too many unique colors, quantization is applied (25 levels per channel, yielding up to 15,625 distinct colors) to bring the palette within limits. If quantization still exceeds the limit, the palette is disabled (`undefined`) and the shader falls back to per-vertex colors.

**Key files**:
- `src/vim-web/core-viewers/webgl/loader/materials/colorPalette.ts` - Palette building with quantization
- `src/vim-web/core-viewers/webgl/loader/progressive/mappedG3d.ts` - `MappedG3d` type definition
- `src/vim-web/core-viewers/webgl/loader/progressive/insertableGeometry.ts` - `submeshColor` lookup in geometry building

## How to Profile

### Timing Instrumentation Pattern

Add cumulative timing to identify hotspots. This pattern collects timing across many calls (e.g., thousands of mesh builds) rather than measuring a single call:

```typescript
class SomeFactory {
  private static _cumulativeTiming = {
    phase1: 0,
    phase2: 0,
    calls: 0
  }

  someMethod() {
    const t0 = performance.now()
    // ... phase 1 work
    const t1 = performance.now()
    SomeFactory._cumulativeTiming.phase1 += t1 - t0

    // ... phase 2 work
    const t2 = performance.now()
    SomeFactory._cumulativeTiming.phase2 += t2 - t1

    SomeFactory._cumulativeTiming.calls++
  }

  static logAndResetTiming(label: string) {
    const t = SomeFactory._cumulativeTiming
    console.log(`[SomeFactory] ${label} breakdown (${t.calls} calls):`)
    console.log(`  Phase 1: ${t.phase1.toFixed(2)}ms`)
    console.log(`  Phase 2: ${t.phase2.toFixed(2)}ms`)
    // Reset for next batch
    t.phase1 = 0
    t.phase2 = 0
    t.calls = 0
  }
}
```

### Profiling Steps

1. **Add timing instrumentation** using the cumulative pattern above
2. **Look for gaps** - If outer timing is much larger than the sum of inner phases, the overhead between phases is the real bottleneck
3. **Use Chrome DevTools** - Performance tab, look for long tasks and GC pauses
4. **Test on real models** - Performance characteristics vary significantly by model size and complexity
5. **Compare before/after** - Always measure the impact of changes

## Optimization Principles

### What to Optimize

1. **Eliminate unnecessary work** - Deferring or skipping work entirely yields the largest gains (e.g., lazy Element3D creation)
2. **Hot loops** - Code executed millions of times (vertex/index loops in geometry building)
3. **Allocations in loops** - Reuse buffers, minimize GC pressure
4. **Cache locality** - Copy data to local arrays before tight loops

### What NOT to Optimize (Diminishing Returns)

1. **Three.js internals** - `BufferGeometry` creation, `computeBoundingBox()` are already well-optimized
2. **One-time operations** - Setup code executed once per mesh type
3. **Already-fast code** - Operations under a few milliseconds with no clear improvement path
4. **Micro-optimizations without measurement** - Always measure before and after

### Red Flags to Investigate

- **Outer timing >> inner timing** - Indicates hidden overhead between instrumented phases
- **Per-item overhead > 0.1ms** - For operations on thousands of items, even small overhead compounds
- **Unexpected allocations** - Check Chrome DevTools Performance tab for GC pauses during geometry building

## References

- **Loading Pipeline**: [CLAUDE.md -- Loading Pipeline](../../CLAUDE.md)
- **Mesh Building**: `src/vim-web/core-viewers/webgl/loader/progressive/vimMeshFactory.ts`
- **Scene Management**: `src/vim-web/core-viewers/webgl/loader/scene.ts`
- **Element3D**: `src/vim-web/core-viewers/webgl/loader/element3d.ts`
- **Color Palette**: `src/vim-web/core-viewers/webgl/loader/materials/colorPalette.ts`
