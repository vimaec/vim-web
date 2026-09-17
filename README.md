# VIM Web

3D viewers for VIM files with BIM (Building Information Modeling) support. VIM files are optimized 3D building models that contain both geometry and rich BIM metadata (elements, properties, categories, etc.). The UI is framework-free DOM built on the [vim-html-ds](https://github.com/vimaec/vim-html-ds) design system.

## Getting Started

```bash
git submodule update --init   # vim-html-ds (design system)
npm install
npm run dev           # Dev server at localhost:5173 (`/` WebGL, `/ultra` Ultra, `?vim=<url>`)
npm run build         # Production build (vite + tsc declarations + rollup d.ts bundles)
npm run documentation # TypeDoc generation
```

`npm run build:ds` builds the submodule; it runs automatically before `dev` and `build`.

### Build Pipeline

`npm run build` runs three steps in sequence:

1. **Vite build** — bundles `vim-web.js` (ESM) and `vim-web.iife.js` (IIFE) into `dist/`
2. **TypeScript declarations** (`tsc -p tsconfig.types.json`) — emits individual `.d.ts` files to `dist/types/`
3. **Rollup d.ts bundling** — produces two self-contained type bundles:
   - `dist/vim-web.d.ts` — full library API (3,300+ lines), referenced by `"types"` in package.json
   - `dist/vim-bim.d.ts` — standalone BIM data types from `vim-format` (1,900+ lines)

### Type Bundles & AI Tooling

The bundled `.d.ts` files serve a dual purpose:

**`vim-web.d.ts`** is the package's type entry point. It inlines types from `ste-signals`, `ste-events`, `ste-core` and the `vim-html-ds` submodule so consumers get full type information without needing those packages. Types from `three`, `deepmerge`, and `vim-format` remain external imports.

**`vim-bim.d.ts`** bundles all BIM data interfaces (`IElement`, `ICategory`, `IRoom`, `VimDocument`, etc.) from `vim-format` into a single self-contained file. This is designed as an **AI-readable reference** — an LLM can read this one file to understand the complete BIM data model without needing access to the `vim-format` package source. It is not imported by the library itself.

Both files have semantic namespace names (e.g., `Core_Webgl`, `Dom_Ultra`) instead of the opaque `index_d$1` names that `rollup-plugin-dts` generates by default. This makes them readable by both humans and AI tools. The rollup configs (`rollup.dts.config.mjs`, `rollup.bim-dts.config.mjs`) handle the namespace renaming and various fixups.

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
├── state/                  # StateRef / FuncRef observables
├── icons/                  # SVG icon data + factory
└── dom-viewers/            # UI layer on vim-html-ds (VIM.Dom)
    ├── webgl/, ultra/      # Viewer roots (createViewer), settings, adapters
    ├── bim/                # BIM panel: virtual tree, search, info panel
    ├── controlbar/, panels/, modal/, generic/, settings/, errors/, components/
    └── state/              # Framing, section box, isolation, UI toggles, side state
```

### Import Discipline

- **Core files** (`core-viewers/`): Import directly from source files, never through barrel files
- **UI layer** (`dom-viewers/`): Import the core through its barrel (`import * as Core from '../../core-viewers'`) and the design system through `dom-viewers/ds.ts`

## Key Concepts

- **Element3D**: Primary object representing a BIM element. Controls visibility, color, outline, and provides access to BIM metadata.
- **Selection**: Observable selection state with multi-select, events, and bounding box queries.
- **Camera**: Fluent API with `snap()` (instant) and `lerp(duration)` (animated) for framing, orbiting, and zooming.
- **Gizmos**: Section box, measurement tool, and markers.
- **StateRef/FuncRef**: Observable state and callable function references used across the UI layer and its public API.
- **ViewerApi**: The root API handle returned by `VIM.Dom.Webgl.createViewer()` / `VIM.Dom.Ultra.createViewer()`. Provides `load()`, `open()`, `unload()`, and access to all subsystems (isolation, sectionBox, controlBar, etc.).

## Customization

The viewer exposes customization points for:
- **Control bar**: Add/replace toolbar buttons via `viewer.controlBar.customize()` (icons are `(options?) => Element` factories, e.g. `VIM.Dom.Icons.*`)
- **Context menu**: Add custom menu items via `viewer.contextMenu.customize()`
- **BIM info panel**: Modify displayed data (`viewer.bimInfo.onData`) or override rendering at any level with DOM-returning callbacks
- **Runtime UI toggles**: `viewer.ui.<key>.set(false)` for every panel and button
- **Floating panels**: Modify section box offset and isolation render settings fields via `viewer.sectionBoxPanel` / `viewer.isolationPanel`

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** — Detailed API reference, code examples, architecture details, and patterns. This is the primary reference for both developers and AI tools.
- **[.claude/docs/INPUT.md](./.claude/docs/INPUT.md)** — Input system architecture, coordinate systems, override patterns
- **[.claude/docs/optimization.md](./.claude/docs/optimization.md)** — Loading pipeline performance and profiling
- **[.claude/docs/RENDERING_OPTIMIZATIONS.md](./.claude/docs/RENDERING_OPTIMIZATIONS.md)** — Shader material architecture and rendering patterns

## Tech Stack

- **TypeScript 6**, **Vite 8**, no UI framework
- **Three.js 0.183**
- **vim-html-ds** (git submodule) — design tokens and imperative DOM components
- **@headless-tree/core** for BIM tree state, windowed with the design system's `windowRange()`
- **ste-signals/ste-simple-events** for typed events, **vim-format** for BIM data
- **Rollup** + **rollup-plugin-dts** for type bundle generation

## Code Style

- No semicolons, trailing commas, single quotes
- Index files control module exports
- No test framework — build pass is the verification
- No linter or formatter — TypeScript compiler is the only gate
- No deprecated code or backwards-compatibility shims
