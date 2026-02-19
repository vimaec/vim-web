---
name: optimize
description: Profile and optimize loading pipeline or rendering performance. Use when investigating performance bottlenecks, optimizing shaders, or improving load times.
allowed-tools: Read, Grep, Glob
---

# Performance Optimization

Guide for profiling and optimizing the VIM loading pipeline and WebGL rendering.

## Loading Pipeline Phases

```
Network/Parsing → Geometry Building (~400ms) → GPU Upload → First Render
```

### Geometry Building Pipeline

```
VimMeshFactory.add(G3dSubset)
  ├─ Split by instance count: ≤5 → merged, >5 → instanced
  ├─ Merged path (InsertableMeshFactory)
  │   ├─ G3dSubset.chunks(16M indices)
  │   ├─ Create InsertableMesh per chunk
  │   ├─ insertFromG3d() — bake matrices, build geometry
  │   └─ scene.addMesh() — register submeshes
  └─ Instanced path (InstancedMeshFactory)
      ├─ Create THREE.InstancedMesh per unique geometry
      ├─ setMatrices() — GPU instancing matrices
      └─ scene.addMesh() — register submeshes
```

### Key Files

| File | Purpose |
|------|---------|
| `loader/progressive/vimMeshFactory.ts` | Entry point, splits merged vs instanced |
| `loader/progressive/insertableMeshFactory.ts` | Merged mesh creation |
| `loader/progressive/insertableGeometry.ts` | Geometry building with per-vertex attributes |
| `loader/progressive/instancedMeshFactory.ts` | GPU instanced mesh creation |
| `loader/scene.ts` | Scene management, submesh registration |
| `loader/element3d.ts` | Element3D (lazy creation pattern) |
| `loader/materials/` | All shader materials |

## Profiling Technique

Use cumulative timing to identify hotspots:

```typescript
class SomeFactory {
  private static _timing = { phase1: 0, phase2: 0, calls: 0 }

  someMethod() {
    const t0 = performance.now()
    // phase 1 work
    const t1 = performance.now()
    SomeFactory._timing.phase1 += t1 - t0
    // phase 2 work
    SomeFactory._timing.phase2 += performance.now() - t1
    SomeFactory._timing.calls++
  }

  static logTiming(label: string) {
    const t = SomeFactory._timing
    console.log(`[${label}] ${t.calls} calls: phase1=${t.phase1.toFixed(2)}ms, phase2=${t.phase2.toFixed(2)}ms`)
    t.phase1 = 0; t.phase2 = 0; t.calls = 0
  }
}
```

### Red Flags

- **Outer timing >> sum of inner phases** — hidden overhead between instrumented code
- **Per-item overhead > 0.1ms** — compounds across thousands of items
- **GC pauses** — check Chrome DevTools Performance tab for unexpected allocations

## Loading Optimization Principles

### What to Optimize

1. **Eliminate unnecessary work** — e.g., lazy Element3D creation saved 45%
2. **Hot loops** — code executed millions of times (vertex/index loops)
3. **Allocations in loops** — reuse buffers, minimize GC pressure
4. **Cache locality** — copy matrix to local array before tight loops

### What NOT to Optimize

1. **Three.js internals** — `BufferGeometry` creation, `computeBoundingBox()` already optimized
2. **One-time operations** — setup code executed once per mesh
3. **Already-fast code** — <5ms operations with no clear improvement path
4. **Micro-optimizations without measurement** — always measure before/after

## Color Palette System

Always-enabled optimization for color storage:

1. **`submeshColor: Uint16Array`** — ALWAYS present, maps submesh→colorIndex
2. **`colorPalette: Float32Array | undefined`** — texture with unique colors, undefined if >16,384 unique colors

Key files: `colorPalette.ts`, `geometry.ts:55-79`, `insertableGeometry.ts:200`

## Shader Optimization Rules

### Move Computations Up the Pipeline

```
Constants → Pre-compute in JavaScript (BEST)
Per-frame  → Compute in uniforms
Per-vertex → Vertex shader
Per-fragment → Only when necessary (MOST EXPENSIVE)
```

### Avoid in Fragment Shaders

| Operation | Cost | Alternative |
|-----------|------|-------------|
| `normalize()` on constants | 10-15x | Pre-normalize in JS |
| Division (`a / b`) | 3-5x | Pre-multiply reciprocal |
| `sqrt()`, `sin()`, `cos()` | 8-12x | Use approximations or pre-compute |
| Conditional branching | GPU may execute both paths | Use `step()`, `mix()`, `clamp()` |

### Good in Shaders

- Uniform reads (1x), texture fetches (2-4x)
- Add/subtract/multiply (1x)
- Dot/cross products
- `texelFetch()` for indexed access (WebGL 2)
- Early return in vertex shader (skips remaining work)

### GLSL3 Syntax (All Materials Use This)

| GLSL1 | GLSL3 |
|-------|-------|
| `attribute` | `in` (vertex shader) |
| `varying` | `out` (vertex), `in` (fragment) |
| `gl_FragColor` | `out vec4 fragColor` |
| `texture2D()` | `texture()` |
| N/A | `texelFetch()` for indexed access |

## Applied Optimizations Reference

| Optimization | File | Impact |
|--------------|------|--------|
| Lazy Element3D creation | `scene.ts` | 45% reduction in addMesh() |
| Matrix buffer reuse in hot loop | `insertableGeometry.ts` | Minor, better cache locality |
| Pre-normalized light direction | `simpleMaterial.ts` | 10-15% fragment shader time |
| Pre-divided ghost opacity | `ghostMaterial.ts` | 2-5% fragment shader time |
| Color palette enforcement | `standardMaterial.ts` | 1-3% rendering time |
| Temp vector reuse | `pickingMaterial.ts` | Smoother frame times |
| GLSL3 consistency | All materials | Driver-level optimizations |

## Future Opportunities

### High Impact
- Merge simple + ghost materials (reduce shader switching)
- Instance color packing (RGB → uint, 66% less vertex data)
- LOD system (simpler shaders for distant objects)

### Medium Impact
- CPU frustum culling, occlusion culling
- Shader variants (hasClipping vs noClipping)
- Parallel geometry building with Web Workers
- Streaming GPU upload

## Process

1. **Identify bottleneck** — add cumulative timing instrumentation
2. **Measure baseline** — run with real models, record numbers
3. **Make ONE change** — isolate the variable
4. **Measure again** — compare before/after
5. **Run `npm run build`** — verify nothing broke
6. **Report results** — file, change, before/after numbers
