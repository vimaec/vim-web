# VIM Loading Performance Optimization

This document captures optimization work done on the VIM file loading pipeline, focusing on the geometry building phase.

## Overview

VIM file loading consists of several phases:
1. **Network/Parsing** - Fetch and parse BFast container
2. **Geometry Building** - Create Three.js meshes from G3d data (~400ms for typical models)
3. **GPU Upload** - Transfer geometry to GPU
4. **Rendering** - First frame render

Our optimization focused on **Phase 2: Geometry Building**, which was the primary bottleneck.

## Key Bottlenecks Identified

### 1. Element3D Wiring Overhead (SOLVED - 45% reduction)

**Problem**: `scene.addMesh()` was taking 43.70ms, with most time spent creating and wiring Element3D objects during mesh loading.

**Solution**: Removed ALL Element3D creation from `addSubmesh()`. Element3D objects are now created lazily when first accessed via `vim.getElement()`.

**Impact**:
- `scene.addMesh()`: 43.70ms → 23.90ms (45% reduction)
- Total geometry building: ~447ms → ~399ms

**Files Changed**:
- [scene.ts:152-160](src/vim-web/core-viewers/webgl/loader/scene.ts#L152-L160) - Simplified `addSubmesh()` to only build instance→submesh map
- [scene.ts:167](src/vim-web/core-viewers/webgl/loader/scene.ts#L167) - Updated comment to reflect lazy Element3D creation

**Pattern**: When building large scenes, defer expensive object creation until actually needed. Map-based lookups are cheap; full object graphs are expensive.

### 2. Matrix Allocation in Hot Loops (Minor improvement)

**Problem**: Allocating `new Float32Array(16)` inside the per-instance loop created unnecessary allocations.

**Solution**: Moved matrix buffer allocation outside the instance loop.

**Impact**: Minimal performance gain, but cleaner code and better cache locality.

**Files Changed**:
- [insertableGeometry.ts:164](src/vim-web/core-viewers/webgl/loader/progressive/insertableGeometry.ts#L164) - Reusable matrix buffer
- [insertableGeometry.ts:176-178](src/vim-web/core-viewers/webgl/loader/progressive/insertableGeometry.ts#L176-L178) - Copy matrix elements to local array

**Pattern**: In hot loops (millions of iterations), reuse buffers and minimize allocations. Cache locality matters.

## Architecture Clarifications

### Color Palette System

The color palette optimization is **always enabled** and consists of two parts:

1. **`submeshColor: Uint16Array`** - ALWAYS present, maps submesh→colorIndex
2. **`colorPalette: Float32Array | undefined`** - Texture with unique colors, undefined if >16,384 unique colors

**Key Files**:
- [mappedG3d.ts:19-22](src/vim-web/core-viewers/webgl/loader/progressive/mappedG3d.ts#L19-L22) - Type definition
- [colorPalette.ts](src/vim-web/core-viewers/webgl/loader/materials/colorPalette.ts) - Palette building with quantization
- [geometry.ts:55-79](src/vim-web/core-viewers/webgl/loader/geometry.ts#L55-L79) - Color palette index creation
- [insertableGeometry.ts:200](src/vim-web/core-viewers/webgl/loader/progressive/insertableGeometry.ts#L200) - Direct `submeshColor` lookup (no fallback)

**Naming Conventions** (cleaned up in this optimization pass):
- ~~`submeshToColorIndex`~~ → `submeshColor` (mapping is mandatory, not optional)
- ~~`submeshIndices`~~ → `colorPaletteIndex` (clearer intent)
- Removed unnecessary `?? submesh` fallbacks since `submeshColor` is always present

### Mesh Building Pipeline

```
VimMeshFactory.add(G3dSubset)
  ├─ Split by instance count: ≤5 instances → merged, >5 → instanced
  ├─ Merged path (InsertableMeshFactory)
  │   ├─ G3dSubset.chunks(16M indices) — chunk large meshes
  │   ├─ Create InsertableMesh per chunk
  │   ├─ insertFromG3d() — bake matrices, build geometry
  │   └─ scene.addMesh() — register submeshes
  └─ Instanced path (InstancedMeshFactory)
      ├─ Create THREE.InstancedMesh per unique geometry
      ├─ setMatrices() — GPU instancing matrices
      └─ scene.addMesh() — register submeshes
```

**Chunk Size**: 16M indices (not vertices) per merged mesh. Chosen because GPU picking removes raycast traversal constraints.

## Timing Instrumentation Pattern

When investigating bottlenecks, add cumulative timing to identify hotspots:

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

**Examples**:
- [instancedMeshFactory.ts:26-53](src/vim-web/core-viewers/webgl/loader/progressive/instancedMeshFactory.ts#L26-L53)
- [insertableGeometry.ts:116-296](src/vim-web/core-viewers/webgl/loader/progressive/insertableGeometry.ts#L116-L296)
- [vimMeshFactory.ts:74-120](src/vim-web/core-viewers/webgl/loader/progressive/vimMeshFactory.ts#L74-L120)

## Optimization Principles

### What to Optimize

1. **Eliminate unnecessary work** - e.g., lazy Element3D creation saved 45%
2. **Hot loops** - Code executed millions of times (vertex/index loops)
3. **Allocations in loops** - Reuse buffers, minimize GC pressure
4. **Cache locality** - Copy matrix to local array before tight loops

### What NOT to Optimize (Diminishing Returns)

1. **Three.js internals** - `BufferGeometry` creation, `computeBoundingBox()` already optimized
2. **One-time operations** - Setup code executed once per mesh
3. **Already-fast code** - <5ms operations with no clear improvement path
4. **Micro-optimizations without measurement** - Always measure before/after

### Red Flags to Investigate

- **Outer timing >> inner timing** - Indicates overhead between instrumented code (e.g., 111ms outer with 31ms inner = 80ms gap)
- **Per-item overhead > 0.1ms** - For operations on thousands of items, even small overhead compounds
- **Unexpected allocations** - Check Chrome DevTools Performance tab for GC pauses

## Performance Results Summary

| Phase | Before | After | Improvement |
|-------|--------|-------|-------------|
| Geometry building (total) | ~447ms | ~399ms | ~48ms (11%) |
| scene.addMesh() (instanced) | 43.70ms | 23.90ms | 45% |
| Merged mesh geometry | ~143-148ms | ~143ms | Stable |

**Key Insight**: The biggest wins come from eliminating unnecessary work (lazy creation), not micro-optimizations.

## Future Optimization Opportunities

1. **GPU Upload** - Not yet investigated, may have opportunities
2. **Instanced mesh creation** - `createGeometry` (18.20ms) and `createInstancedMesh` (18.20ms) phases
3. **Parallel geometry building** - Web Workers for CPU-heavy mesh building
4. **Streaming upload** - Upload geometry to GPU as it's built, not all at once

## How to Profile

1. **Add timing instrumentation** using the cumulative pattern above
2. **Look for gaps** - Outer timing much larger than sum of inner phases
3. **Use Chrome DevTools** - Performance tab, look for long tasks and GC
4. **Test on real models** - Performance characteristics vary by model size/complexity
5. **Compare before/after** - Always measure impact of changes

## References

- **Loading Pipeline**: [CLAUDE.md § Loading Pipeline](../CLAUDE.md#loading-pipeline-webgl)
- **Mesh Building**: [vimMeshFactory.ts](../src/vim-web/core-viewers/webgl/loader/progressive/vimMeshFactory.ts)
- **Scene Management**: [scene.ts](../src/vim-web/core-viewers/webgl/loader/scene.ts)
- **Element3D**: [element3d.ts](../src/vim-web/core-viewers/webgl/loader/element3d.ts)

