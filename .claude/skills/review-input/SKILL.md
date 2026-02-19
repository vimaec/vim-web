---
name: review-input
description: Review input system code for vector reference bugs, cleanup issues, coordinate misuse, and adapter violations. Use when modifying input handlers, adapters, or touch/mouse/keyboard code.
allowed-tools: Read, Grep, Glob
---

# Review Input System

Review the specified files (or scan `src/vim-web/core-viewers/shared/` and `src/vim-web/core-viewers/*/` input files) for these issues:

## Key Files

| File | Purpose |
|------|---------|
| `core-viewers/shared/inputHandler.ts` | Main coordinator, manages modes and routing |
| `core-viewers/shared/mouseHandler.ts` | Mouse/pointer event handling |
| `core-viewers/shared/touchHandler.ts` | Touch gesture recognition |
| `core-viewers/shared/keyboardHandler.ts` | Keyboard input with WASD movement |
| `core-viewers/shared/inputAdapter.ts` | IInputAdapter interface definition |
| `core-viewers/webgl/viewer/inputAdapter.ts` | WebGL adapter implementation |
| `core-viewers/ultra/inputAdapter.ts` | Ultra/RPC adapter implementation |
| `core-viewers/shared/inputConstants.ts` | Shared constants |

## 1. Temp Vector Reference Bugs (HIGH PRIORITY)

The input system uses reusable temp vectors for performance (avoiding per-frame GC). Storing a reference instead of copying values causes silent corruption.

```typescript
// ❌ WRONG — stores reference to temp vector
this._lastPosition = pos
// Next frame, pos points to new values, _lastPosition sees them too

// ✅ CORRECT — copies values
this._lastPosition.copy(pos)

// ✅ CORRECT — clone if storing outside handler
const savedPos = pos.clone()
```

**Check for:**
- Any assignment of a handler callback parameter to a stored field without `.copy()`
- `this._someVector = someParam` (should be `this._someVector.copy(someParam)`)
- Storing references from `onClick`, `onDrag`, `onPointerDown` callbacks

## 2. Coordinate System Correctness

Three coordinate systems exist — using the wrong one causes subtle positioning bugs.

| System | Range | Used For |
|--------|-------|----------|
| Canvas-relative | [0,1] x [0,1] | Raycasting, clicks, drags, internal logic |
| Client pixels | Screen coords | UI positioning (context menus, tooltips) |
| World space | THREE.Vector3 | 3D operations, camera movement |

**Check for:**
- Passing pixel coordinates where canvas-relative is expected
- Missing `/ rect.width` or `/ rect.height` normalization
- Using canvas-relative positions for UI overlay positioning

## 3. Handler Cleanup

Every registered handler must be cleaned up on dispose:

```typescript
// ✅ CORRECT — saves and restores
const original = inputs.mouse.onClick
inputs.mouse.onClick = customHandler
// On dispose:
inputs.mouse.onClick = original

// ❌ WRONG — leaks custom handler
inputs.mouse.onClick = customHandler
// Never restored
```

**Check for:**
- Custom key handlers registered without corresponding unregister
- `addEventListener` without matching `removeEventListener`
- Pointer/touch event listeners not cleaned up on dispose

## 4. Pointer Mode System

Two-tier mode management — `pointerActive` (user preference) and `pointerOverride` (temporary):

- `pointerActive`: Set by user/app. Used for left-click drag. Values: ORBIT, LOOK, PAN, ZOOM, RECT
- `pointerOverride`: Set by middle/right click. Cleared on mouse up. Takes priority over active.

**Check for:**
- Setting `pointerOverride` without clearing it (gets stuck)
- Not checking both modes: `override ?? active`
- Missing `onPointerModeChanged` event fire after mode change

## 5. IInputAdapter Compliance

Adapter implementations must match the interface:

```typescript
interface IInputAdapter {
  orbitCamera(rotation: Vector2): void
  rotateCamera(rotation: Vector2): void
  panCamera(delta: Vector2): void
  dollyCamera(delta: Vector2): void
  moveCamera(velocity: Vector3): void
  selectAtPointer(pos: Vector2, add: boolean): Promise<void>
  frameAtPointer(pos: Vector2): Promise<void>
  zoom(value: number, screenPos?: Vector2): Promise<void>
  pinchStart(screenPos: Vector2): Promise<void>
  pinchZoom(totalRatio: number): void
  clearSelection(): void
  keyDown(keyCode: string): boolean
  keyUp(keyCode: string): boolean
  pointerDown(pos: Vector2, button: number): void
  pointerMove(pos: Vector2): void
  pointerUp(pos: Vector2, button: number): void
}
```

**Check for:**
- Missing adapter methods (both WebGL and Ultra must implement all)
- Inconsistent parameter handling between WebGL and Ultra adapters
- WebGL adapter directly manipulating camera vs Ultra adapter sending RPC

## 6. Touch Gesture Issues

Touch handling uses explicit boolean flags for state:

**Check for:**
- Missing `touchcancel` handling (causes stuck gestures)
- Not resetting touch state flags on cancel/end
- Pinch ratio calculations without bounds checking
- Missing `preventDefault()` on handled touch events

## 7. Constants and Thresholds

From `inputConstants.ts`:
- `CLICK_MOVEMENT_THRESHOLD = 0.003` (canvas-relative)
- `DOUBLE_CLICK_DISTANCE_THRESHOLD = 5` (pixels)
- `DOUBLE_CLICK_TIME_THRESHOLD = 300` (ms)
- `TAP_DURATION_MS = 500`
- `TAP_MOVEMENT_THRESHOLD = 5` (pixels)
- `MIN_MOVE_SPEED = -10`, `MAX_MOVE_SPEED = 10`

**Check for:**
- Hardcoded thresholds that should use constants
- Speed values outside the valid range
- Mixed units (pixels vs canvas-relative) in comparisons

## Output Format

For each issue: **File:line** | **Category** | **Severity** | **Description** | **Fix**
