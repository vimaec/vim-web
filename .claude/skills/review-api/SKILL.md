---
name: review-api
description: Review public API surfaces for consistency between WebGL and Ultra viewers, leaked internals, and missing fields. Use when modifying ViewerApi types or shared state.
allowed-tools: Read, Grep, Glob
---

# Review Public API Surfaces

Review the public API types for consistency and correctness. Focus on these files:

- `src/vim-web/react-viewers/webgl/viewerApi.ts` — WebGL ViewerApi
- `src/vim-web/react-viewers/ultra/viewerApi.ts` — Ultra ViewerApi
- `src/vim-web/react-viewers/state/sharedIsolation.ts` — IsolationApi
- `src/vim-web/react-viewers/state/sectionBoxState.ts` — SectionBoxApi
- `src/vim-web/react-viewers/state/cameraState.ts` — CameraApi
- `src/vim-web/react-viewers/state/settingsApi.ts` — SettingsApi
- `src/vim-web/react-viewers/controlbar/controlBar.tsx` — ControlBarApi

Also check the barrel exports:
- `src/vim-web/react-viewers/webgl/index.ts`
- `src/vim-web/react-viewers/ultra/index.ts`
- `src/vim-web/react-viewers/index.ts`

## Checks

### 1. WebGL / Ultra Consistency
Both ViewerApi types should have matching fields where applicable:
- `type`, `container`, `core`, `isolation`, `sectionBox`, `camera`, `settings`, `modal`, `controlBar`, `dispose`
- `isolationPanel`, `sectionBoxPanel` (GenericPanelHandle)
- JSDoc comments should match for shared fields

### 2. No Internal Leaks
- Interfaces should NOT expose adapter refs, internal state, or implementation details
- `IsolationApi` delegates to adapter internally — adapter must not appear in the interface
- Gizmo interfaces should only expose user-facing methods (no `show()`/`setPosition()` that are auto-managed)

### 3. Shared Types in Shared Locations
- Types used by both viewers belong in `state/` or `helpers/`, not in `webgl/` or `ultra/`
- Cross-viewer imports (ultra importing from `../webgl`) are wrong

### 4. JSDoc Completeness
- Every field on ViewerApi should have a JSDoc comment
- Comments must match the actual field (watch for copy-paste errors like "isolation panel" on sectionBoxPanel)

### 5. Barrel Export Discipline
- React layer imports through barrels (`import * as Core from '../../core-viewers'`)
- Core files import directly from source files
- Check that public types are properly exported through index.ts barrels
- Check that internal types are NOT exported

## Output Format

For each issue: **File:line** | **Category** | **Description** | **Fix**
