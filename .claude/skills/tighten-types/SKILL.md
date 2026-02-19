---
name: tighten-types
description: Create or tighten TypeScript interfaces to hide implementation details. Use when a class exposes too many internals through its public API, or when you need to create an interface that only shows user-facing methods.
allowed-tools: Read, Grep, Glob
---

# Tighten TypeScript Interfaces

Create tight interfaces that hide implementation details from public API surfaces. The goal is that `.d.ts` output only shows what consumers need.

## Process

1. **Read the concrete class** — identify ALL public members
2. **Categorize each member**:
   - **User-facing**: Methods/properties consumers actually call (keep)
   - **Framework-managed**: Methods called automatically by internal systems (hide — e.g., `show()`/`setPosition()` on gizmos that are auto-managed by camera subscriptions)
   - **Internal plumbing**: Implementation details (hide)
3. **Create the interface** with only user-facing members
4. **Update the public getter** to return the interface type instead of the concrete class
5. **Verify** `.d.ts` output no longer exposes internals

## Patterns Used in This Codebase

### Gizmo Interfaces
Concrete gizmo classes store on private fields; public getter returns interface type:

```typescript
// In the class file
export interface IGizmoOrbit {
  enabled: boolean
  setSize(size: number): void
  setColors(color: THREE.Color, colorHorizontal: THREE.Color): void
  setOpacity(opacity: number, opacityAlways: number): void
}

// In gizmos.ts
get orbit(): IGizmoOrbit { return this._orbit }
```

### Adapter + Delegation Pattern
For React state, use delegation methods instead of exposing adapters:

```typescript
// GOOD — delegates internally
export interface IsolationApi {
  hasSelection(): boolean
  isolateSelection(): void
  showAll(): void
  // ...
}

// BAD — leaks adapter
export interface IsolationApi {
  adapter: RefObject<IIsolationAdapter>  // exposes internal
}
```

### Private Fields with @internal
When you can't use interfaces (e.g., fields accessed by siblings in same package), use `private` instead of `@internal readonly`:

```typescript
// GOOD
private readonly _renderer: Renderer

// BAD — shows in .d.ts
/** @internal */ readonly _renderer: Renderer
```

## Verification

After tightening, always:
1. Run `npm run build` — must pass
2. Check the `.d.ts` output — tightened internals should not appear
3. Search for any external code that relied on the now-hidden members
