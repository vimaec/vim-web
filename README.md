# VIM Web

React-based 3D viewers for VIM files with BIM (Building Information Modeling) support. VIM files are optimized 3D building models that contain both geometry and rich BIM metadata (elements, properties, categories, etc.).

## Getting Started

```bash
npm install
npm run dev           # Dev server at localhost:5173
npm run build         # Production build
npm run eslint        # Lint
npm run documentation # TypeDoc generation
```

## Architecture Overview

### Dual Viewer System

| Viewer | Use Case | Rendering |
|--------|----------|-----------|
| **WebGL** | Small-medium models | Local Three.js rendering |
| **Ultra** | Large models | Server-side streaming via WebSocket RPC |

### Layer Separation

```
src/vim-web/
├── core-viewers/           # Framework-agnostic (no React)
│   ├── webgl/              # Local Three.js rendering
│   │   ├── loader/         # VIM parsing, mesh building, scene, data model
│   │   │   ├── progressive/  # Geometry loading & mesh construction
│   │   │   └── materials/    # Shader materials
│   │   └── viewer/         # Camera, raycaster, rendering, gizmos
│   ├── ultra/              # RPC client for streaming server
│   └── shared/             # Common interfaces (IVim, Selection, Input)
└── react-viewers/          # React UI layer
    ├── webgl/              # Full UI (BIM tree, context menu, gizmos)
    ├── ultra/              # Minimal UI
    └── helpers/            # StateRef, hooks, utilities
```

## Loading Pipeline

High-level call chain from URL to rendered scene:

```
viewer.load(url)
  → ComponentLoader.load() — allocates vimIndex (0-255)
    → Core LoadRequest — parses BFast → G3d + VimDocument + ElementMapping
      → Creates Vim (no geometry yet)
    → initVim() — viewer.add(vim), vim.loadAll()
      → Vim.loadSubset(fullSet)
        → VimMeshFactory.add(subset) — splits merged vs instanced
          → Scene.addMesh() → addSubmesh() → Element3D._addMesh()
```

1. **ComponentLoader** (`react-viewers/webgl/loading.ts`) allocates a `vimIndex` (0-255) and creates a `LoadRequest`
2. **LoadRequest** (`progressive/loadRequest.ts`) parses the VIM file (BFast container) into G3d geometry, VimDocument (BIM data), and ElementMapping
3. **Vim** is constructed with a `VimMeshFactory` but no geometry yet
4. **Vim.loadAll()** creates a full G3dSubset and calls `loadSubset()`
5. **VimMeshFactory** routes subsets: meshes with <=5 instances go to `InsertableMeshFactory` (merged), >5 go to `InstancedMeshFactory` (GPU instanced)
6. **Scene.addMesh()** adds Three.js meshes to the renderer, applies transforms, and wires submeshes to Element3D objects

## Rendering Pipeline

Multi-pass compositor (WebGL):

```
Scene (MSAA) → Selection Mask → Outline Pass (edge detection) → FXAA → Merge → Screen
```

Rendering is on-demand: the `needsUpdate` flag is set by camera movements, selection changes, or visibility changes, and cleared after each frame. Key files: `rendering/renderer.ts`, `renderingComposer.ts`.

## GPU Picking

Clicks resolve to BIM elements via a custom shader that renders to a Float32 render target:

- **R** = packed ID (`vimIndex << 24 | elementIndex`) — supports 256 vims x 16M elements
- **G** = depth along camera direction (0 = miss)
- **B/A** = surface normal (x, y); z is reconstructed

IDs are pre-packed during mesh building as per-vertex attributes (merged meshes) or per-instance attributes (instanced meshes). See `gpuPicker.ts` and `pickingMaterial.ts`.

## Mesh Building Strategy

Two strategies based on instance count per unique mesh:

| Strategy | Condition | Implementation | Chunking |
|----------|-----------|----------------|----------|
| **Merged** | <=5 instances | `InsertableMeshFactory` → `InsertableMesh` | Chunks at 4M indices |
| **Instanced** | >5 instances | `InstancedMeshFactory` → `InstancedMesh` | One mesh per unique geometry |

**Merged meshes** duplicate geometry per instance with baked transforms, enabling per-vertex attributes for GPU picking. **Instanced meshes** share geometry across instances using Three.js `InstancedMesh` with per-instance attributes.

Progressive loading is supported via `Vim.loadSubset()` which tracks loaded instances and avoids duplicates using `G3dSubset.except()`.

## Key Concepts

- **Element3D**: Primary object representing a BIM element. Controls visibility, color, outline, and provides access to BIM metadata.
- **Selection**: Observable selection state with multi-select, events, and bounding box queries.
- **Camera**: Fluent API with `snap()` (instant) and `lerp(duration)` (animated) for framing, orbiting, and zooming.
- **Gizmos**: Section box, measurement tool, and markers.
- **StateRef/ActionRef**: Observable state and action system used in the React layer for customization.

## Customization

The React viewer exposes customization points for:
- **Control bar**: Add/replace toolbar buttons
- **Context menu**: Add custom menu items
- **BIM info panel**: Modify displayed data or add custom sections

See [CLAUDE.md](./CLAUDE.md) for detailed API examples and implementation reference.
