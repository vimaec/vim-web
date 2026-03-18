# vim-web 1.0.0-alpha.0

## Selection & Outline Improvements

### Smoother Selection Outlines

Selection outlines now use **Sobel convolution edge detection** with bilinear texture sampling, replacing the previous Chebyshev ring approach. This produces smoother, antialiased outlines with natural soft falloff at the edges.

The outline shader supports a `scale` uniform so that outline thickness remains consistent in screen pixels regardless of the render target resolution.

### Selection Overlay Modes

New selection fill modes that go beyond simple outlines:

- **None** — Outline only (default)
- **Default** — Tint selected meshes directly in the main render pass (zero extra cost)
- **X-Ray** — Renders selected elements on top of everything with a semi-transparent tint
- **See-Through** — Renders a ghost of selected elements where they are behind other geometry

Overlay opacity is adjustable (0–1). Both X-Ray and See-Through render directly into the scene target, preserving the existing depth buffer from the main render pass.

### Render Settings Panel

The **Render Settings** panel (accessible from the control bar) now includes:

| Setting | Type | Range | Default |
|---------|------|-------|---------|
| Transparency | Toggle | — | On |
| Show Ghost | Toggle | — | Off |
| Ghost Opacity | Slider | 0–1 | — |
| Selection Outline | Toggle | — | On |
| Outline Quality | Select | Low / Medium / High | High |
| Outline Thickness | Number | 1–5 | 3 |
| Selection Fill | Select | None / Default / X-Ray / See-Through | None |
| Selection Opacity | Slider | 0–1 | 0.25 |

**Outline Quality** controls the render target resolution for the outline pipeline:
- **Low** (0.5x) — Fastest, softer outlines
- **Medium** (1x) — Balanced
- **High** (2x) — Sharpest outlines, 4x more pixels to process

All settings are available programmatically via `viewer.isolation`:
```typescript
viewer.isolation.outlineQuality.set('high')
viewer.isolation.outlineThickness.set(4)
viewer.isolation.selectionFillMode.set('xray')
viewer.isolation.selectionOverlayOpacity.set(0.3)
```

## Performance

### GPU Picker Scissor Optimization

The GPU picker now uses a **1x1 pixel scissor rect** when picking, instead of rendering the full scene to the pick buffer. The GPU skips fragment processing for all pixels outside the scissor region and can cull geometry that doesn't intersect it. This significantly reduces the cost of each pick operation.

## Dependencies

- Three.js updated from **0.171** to **0.183**
- `@types/three` updated to **0.183.0**
- Migrated `THREE.Clock` to `THREE.Timer` (breaking change in r183)
