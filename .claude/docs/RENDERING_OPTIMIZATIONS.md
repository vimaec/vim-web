# WebGL Shader Materials & Rendering Patterns

This document describes the shader material architecture and rendering patterns used in the WebGL viewer. All materials use GLSL ES 3.0 (WebGL 2).

## Material Architecture

The `Materials` singleton (`materials.ts`) owns and manages all material instances. It exposes a public `IMaterials` interface for property configuration and keeps system materials (mask, outline, merge) internal.

### Material Inventory

| Material | File | Purpose | GLSL Version |
|----------|------|---------|--------------|
| **StandardMaterial** | `standardMaterial.ts` | Default opaque/transparent rendering. Patches Three.js Lambert shader via `onBeforeCompile` to inject palette coloring, visibility, and section strokes. | GLSL1 (Three.js managed) |
| **ModelMaterial** | `modelMaterial.ts` | Fast rendering mode. Custom shader using screen-space derivative normals and pre-normalized lighting. | GLSL3 |
| **GhostMaterial** | `ghostMaterial.ts` | Transparent fill for hidden/ghosted elements in isolation mode. | GLSL3 |
| **PickingMaterial** | `pickingMaterial.ts` | GPU object picking. Outputs packed element ID, depth, and surface normal to Float32 render target. | GLSL3 |
| **MaskMaterial** | `maskMaterial.ts` | Selection mask pass. Writes depth only for selected elements; non-selected vertices are clipped. | GLSL3 |
| **OutlineMaterial** | `outlineMaterial.ts` | Post-process edge detection on depth buffer. Outputs outline intensity to RedFormat texture. | GLSL3 |
| **MergeMaterial** | `mergeMaterial.ts` | Final compositing pass. Blends scene texture with outline texture using configurable color. | GLSL3 |
| **TransferMaterial** | `transferMaterial.ts` | Simple texture passthrough (blit). | GLSL3 |

### MaterialSet

`MaterialSet` (`materialSet.ts`) groups materials by role: `opaque`, `transparent`, and `hidden` (ghost). The `applyMaterial()` helper in `materials.ts` resolves a `MaterialSet` into the correct `THREE.Material` or `[visible, hidden]` array for a given mesh based on its `userData.transparent` flag.

### Color Palette System

All scene materials (StandardMaterial, ModelMaterial) use a shared color palette texture for submesh coloring. The `Materials` singleton owns a single 128x128 RGBA `DataTexture` (16,384 colors max) and distributes it to all materials via `setSubmeshColorTexture()`.

The palette is built by `colorPalette.ts`:
- Extracts unique colors from submesh material data
- If unique colors exceed 16,384, applies uniform quantization (25 levels per channel = 15,625 max)
- Packs into a `Float32Array` for texture upload

Shaders look up colors using `texelFetch` with integer coordinates derived from a per-vertex `submeshIndex` attribute:

```glsl
int x = int(submeshIndex) % 128;
int y = int(submeshIndex) / 128;
vColor = texelFetch(submeshColorTexture, ivec2(x, y), 0).rgb;
```

Instance color overrides are blended using the `colored` attribute (1 = instance color, 0 = palette color):

```glsl
#ifdef USE_INSTANCING
  vColor = colored * instanceColor + (1.0 - colored) * vColor;
#endif
```

---

## Shader Patterns

### Pre-Normalized Light Direction (ModelMaterial)

The light direction is a compile-time constant, avoiding per-fragment `normalize()`:

```glsl
// (sqrt(2), sqrt(3), sqrt(5)) normalized: magnitude = sqrt(10)
const vec3 LIGHT_DIR = vec3(0.447214, 0.547723, 0.707107);
float light = dot(normal, LIGHT_DIR);
light = 0.5 + (light * 0.5); // Remap to [0.5, 1.0]
```

### Pre-Divided Opacity (GhostMaterial)

The ghost opacity uniform stores the final shader value directly (`7/255 = 0.0275`), so the fragment shader uses it as-is without per-fragment division:

```glsl
fragColor = vec4(fillColor, opacity);
```

The `GhostMaterial` class getter/setter expose the raw value without conversion.

### Vertex Shader Early Culling

All visibility-aware materials (Ghost, Model, Mask, Picking) use the same pattern to cull invisible geometry in the vertex shader by placing vertices behind the near plane:

```glsl
if (ignore > 0.0) {
  gl_Position = vec4(0.0, 0.0, -2.0, 1.0);
  return;
}
```

This is faster than fragment `discard` because no fragments are generated for clipped triangles.

### Static Temp Vector Reuse (PickingMaterial)

The `PickingMaterial` class uses a static `THREE.Vector3` for camera direction updates, avoiding per-frame allocations:

```typescript
private static _tempDir = new THREE.Vector3()

updateCamera(camera: THREE.Camera): void {
  camera.getWorldDirection(PickingMaterial._tempDir)
  this.three.uniforms.uCameraPos.value.copy(camera.position)
  this.three.uniforms.uCameraDir.value.copy(PickingMaterial._tempDir)
}
```

### Picking Output Format

The picking material encodes four values into a Float32 RGBA render target:

| Channel | Value | Encoding |
|---------|-------|----------|
| R | Element ID | `uintBitsToFloat(packedId)` where `packedId = (vimIndex << 24) \| elementIndex` |
| G | Depth | Distance along camera direction (0 = miss) |
| B | Normal X | Screen-space derivative normal |
| A | Normal Y | Screen-space derivative normal |

Normal Z is reconstructed as `sqrt(1 - x^2 - y^2)`, always positive since the normal faces the camera.

### Section Stroke Rendering (StandardMaterial)

The standard material renders colored strokes where geometry intersects clipping planes. The stroke width scales with fragment depth using a configurable falloff exponent:

```glsl
float thick = pow(vFragDepth, sectionStrokeFalloff) * sectionStrokeWidth;
```

Perpendicular surfaces are excluded by comparing the surface normal against the clipping plane normal.

---

## Shader Optimization Principles

### General Rules

1. **Move computations out of shaders** whenever possible:
   - Constants: Pre-compute in JavaScript or as shader `const`
   - Per-frame: Compute in uniforms
   - Per-vertex: Keep in vertex shader
   - Per-fragment: Only when necessary

2. **Avoid per-fragment operations:**
   - `normalize()` on constants
   - Divisions (use pre-multiplied reciprocals)
   - Expensive math functions (`sqrt`, `pow`, `sin`, `cos`)
   - Prefer simple arithmetic (`+`, `-`, `*`)
   - Prefer dot products, cross products
   - Texture lookups are GPU-cached and relatively cheap

3. **Memory access patterns:**
   - `texelFetch()` for indexed access (faster than `texture()` when no filtering needed)
   - `uniform` reads are GPU-cached
   - `in` (varying) interpolation cost depends on geometry complexity

4. **Branching:**
   - Early returns in vertex shader skip all subsequent work
   - Fragment shader branches may execute both paths on GPU (warp divergence)

### Relative Cost of Operations

| Operation | Cost | Example |
|-----------|------|---------|
| Uniform read | 1x | `uniform float value` |
| Texture fetch | 2-4x | `texture(sampler, uv)` |
| Addition/Subtraction | 1x | `a + b` |
| Multiplication | 1x | `a * b` |
| Division | 3-5x | `a / b` |
| `normalize()` | 10-15x | `sqrt` + 3 divides |
| `sin()`, `cos()` | 8-12x | Approximated in hardware |

---

## GLSL3 Syntax Reference

All custom shader materials use `glslVersion: THREE.GLSL3`. The StandardMaterial uses Three.js managed GLSL1 (via `onBeforeCompile` patching).

| GLSL1 | GLSL3 |
|-------|-------|
| `attribute` | `in` (vertex shader) |
| `varying` | `out` (vertex), `in` (fragment) |
| `gl_FragColor` | `out vec4 fragColor` |
| `texture2D()` | `texture()` |
| N/A | `texelFetch()` for indexed access |

---

## References

### Material Files

- `src/vim-web/core-viewers/webgl/loader/materials/standardMaterial.ts`
- `src/vim-web/core-viewers/webgl/loader/materials/modelMaterial.ts`
- `src/vim-web/core-viewers/webgl/loader/materials/ghostMaterial.ts`
- `src/vim-web/core-viewers/webgl/loader/materials/pickingMaterial.ts`
- `src/vim-web/core-viewers/webgl/loader/materials/maskMaterial.ts`
- `src/vim-web/core-viewers/webgl/loader/materials/outlineMaterial.ts`
- `src/vim-web/core-viewers/webgl/loader/materials/mergeMaterial.ts`
- `src/vim-web/core-viewers/webgl/loader/materials/transferMaterial.ts`
- `src/vim-web/core-viewers/webgl/loader/materials/materials.ts`
- `src/vim-web/core-viewers/webgl/loader/materials/materialSet.ts`
- `src/vim-web/core-viewers/webgl/loader/materials/colorPalette.ts`

### Related Documentation

- [CLAUDE.md](../../CLAUDE.md) - Main project documentation
- [INPUT.md](./INPUT.md) - Input system architecture
- [optimization.md](./optimization.md) - Loading pipeline performance
