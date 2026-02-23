# Input System Architecture

The VIM Web input system uses a layered adapter pattern to decouple device handling from viewer-specific camera control. This allows the same input handlers to work with both local WebGL rendering and remote Ultra streaming.

## Architecture Overview

```
+-------------------------------------------------------------+
| DOM Events                                                  |
| (pointer, touch, keyboard, wheel)                           |
+-------------------------------------------------------------+
                           |
                           v
+-------------------------------------------------------------+
| Device Handlers (Framework-agnostic)                        |
+-------------------------------------------------------------+
| MouseHandler   -> Pointer events -> Drag, Click, DoubleClick  |
| TouchHandler   -> Touch events -> Tap, Pinch, Pan             |
| KeyboardHandler -> Key events -> WASD movement                |
+-------------------------------------------------------------+
                           |
                           v
+-------------------------------------------------------------+
| InputHandler (Coordinator)                                   |
+-------------------------------------------------------------+
| - Manages pointer modes (ORBIT/LOOK/PAN/ZOOM)              |
| - Routes events to appropriate adapter methods              |
| - Applies speed multipliers                                 |
+-------------------------------------------------------------+
                           |
                           v
+-------------------------------------------------------------+
| IInputAdapter (Viewer-specific implementation)              |
+-------------------------------------------------------------+
| WebGL: Direct THREE.js camera manipulation                  |
| Ultra: RPC calls to server-side renderer                    |
+-------------------------------------------------------------+
```

## Key Files

| File | Purpose |
|------|---------|
| `inputHandler.ts` | Main coordinator, manages modes and routing |
| `mouseHandler.ts` | Mouse/pointer event handling |
| `touchHandler.ts` | Touch gesture recognition |
| `keyboardHandler.ts` | Keyboard input with WASD movement |
| `inputAdapter.ts` | Interface definition |
| `webgl/viewer/inputAdapter.ts` | WebGL implementation |
| `ultra/inputAdapter.ts` | Ultra/RPC implementation |
| `inputConstants.ts` | Shared constants |

---

## Device Handlers

### MouseHandler

Handles mouse and pointer input with support for:
- **Click detection**: Single-click with modifier key support
- **Double-click**: Within 300ms threshold
- **Drag**: Continuous movement with button tracking
- **Context menu**: Right-click without drag
- **Wheel**: Zoom with Ctrl modifier detection

**Coordinate System**: All positions are canvas-relative [0-1]:
- (0, 0) = top-left corner
- (1, 1) = bottom-right corner

**Button Mapping**:
- 0 = Left button (primary interaction)
- 1 = Middle button (pan override)
- 2 = Right button (look override)

### TouchHandler

Handles touch gestures with support for:

**Single Touch**:
- **Tap**: Touch down + up within 500ms, <5px movement
- **Double-tap**: Two taps within 300ms
- **Drag**: Touch down + continuous movement

**Two Touch**:
- **Pinch/Spread**: Distance between fingers changes (zoom)
- **Pan**: Average position of fingers moves (two-finger pan)
- **Simultaneous**: Both pinch and pan can occur at the same time

**State Management**:
- Uses explicit boolean flags (`_hasTouch`, `_hasTouch1`, `_hasTouch2`)
- Storage vectors hold actual position values
- Temp vectors are reused for calculations

### KeyboardHandler

Handles keyboard input with:
- **WASD movement**: Continuous camera movement while keys are held
- **Arrow keys**: Alternative movement keys
- **E/Q**: Up/down movement
- **Shift**: 3x speed multiplier
- **Custom handlers**: Override key down/up callbacks via `override()`

**Override API**:

The `override()` method registers a handler for a key code (or array of codes) on either `'down'` or `'up'` events. The handler receives the previous handler as `original`, enabling chaining. Returns a restore function.

```typescript
// Override R key press
const restore = viewer.core.inputs.keyboard.override('KeyR', 'down', () => {
  console.log('R key pressed')
})
// Later: restore()

// Chain with previous handler
viewer.core.inputs.keyboard.override('KeyR', 'up', (original) => {
  original?.()
  console.log('This runs after the previous handler')
})

// Override multiple keys at once
viewer.core.inputs.keyboard.override(['Equal', 'NumpadAdd'], 'up', () => {
  viewer.core.inputs.moveSpeed++
})
```

---

## Pointer Mode System

Two-tier mode management for flexible interaction:

### 1. pointerMode (Primary Mode)

The user's preferred interaction style:
- **ORBIT**: Rotate camera around target point (target stays fixed)
- **LOOK**: First-person rotation (camera rotates in place)
- **PAN**: Translate camera parallel to view plane
- **ZOOM**: Move camera along view direction (dolly)
- **RECT**: Custom mode for rectangle selection tools

Set by: User preference or application default
Used for: Left-click dragging

```typescript
viewer.core.inputs.pointerMode = VIM.Core.PointerMode.LOOK
```

### 2. pointerOverride (Temporary Mode)

Temporarily overrides the active mode during interaction:
- Set by: Middle-click (PAN), Right-click (LOOK)
- Cleared on: Mouse up
- Used for: Icon display, temporary mode switches

**Priority**: `override > pointerMode`

```typescript
// Listen for mode changes (fires for both pointerMode and pointerOverride changes)
viewer.core.inputs.onPointerModeChanged.subscribe(() => {
  console.log('Mode:', viewer.core.inputs.pointerMode)
  console.log('Override:', viewer.core.inputs.pointerOverride)
})
```

---

## Coordinate Systems

### Canvas-Relative [0-1]

Used internally for all input callbacks:
- Range: [0, 1] x [0, 1]
- (0, 0) = top-left of canvas
- (1, 1) = bottom-right of canvas
- Independent of canvas pixel size
- Used for: clicks, drags, raycasting

```typescript
const restore = viewer.core.inputs.mouse.override({
  onClick: (original, pos, ctrl) => {
    console.log(pos) // THREE.Vector2(0.5, 0.5) = center
    original(pos, ctrl)
  }
})
```

### Client Pixels (Absolute)

Used for UI positioning:
- Range: screen coordinates in pixels
- Used for: context menus, overlays, tooltips

**Conversion Example**:
```typescript
const rect = canvas.getBoundingClientRect()
const clientX = canvasRelative.x * rect.width + rect.left
const clientY = canvasRelative.y * rect.height + rect.top
```

### World Space

Convert canvas position to 3D world coordinates:
```typescript
const result = await viewer.core.raycaster.raycastFromScreen(canvasPos)
if (result?.worldPosition) {
  console.log(result.worldPosition) // THREE.Vector3 in world space
}
```

---

## Performance: Reusable Vectors

Critical pattern to eliminate per-frame garbage collection.

### Temp Vectors (Reusable)

Used for intermediate calculations, **never store references**:

```typescript
class MouseHandler {
  private _tempPosition = new THREE.Vector2() // Reused every frame

  private relativePosition(event: PointerEvent): THREE.Vector2 {
    this._tempPosition.set(
      event.offsetX / rect.width,
      event.offsetY / rect.height
    )
    return this._tempPosition // Safe to return for immediate use
  }
}
```

### Storage Vectors (State)

Hold actual state values, **must copy from temp**:

```typescript
class DragHandler {
  private _lastDragPosition = new THREE.Vector2() // Storage
  private _delta = new THREE.Vector2()            // Temp

  onPointerDown(pos: THREE.Vector2): void {
    this._lastDragPosition.copy(pos) // Copy values
    // this._lastDragPosition = pos  // WRONG: Stores reference!
  }

  onPointerMove(pos: THREE.Vector2): void {
    this._delta.set(
      pos.x - this._lastDragPosition.x,
      pos.y - this._lastDragPosition.y
    )
    this._lastDragPosition.copy(pos) // Copy values
    this._onDrag(this._delta)
  }
}
```

### Common Pitfall

```typescript
// WRONG: Stores reference to temp vector
const pos = handler.relativePosition(event)
this._lastPosition = pos

// Next frame, pos points to new values
// this._lastPosition also sees new values (same object!)
// Delta calculation: newPos - newPos = (0, 0)

// CORRECT: Copy values
const pos = handler.relativePosition(event)
this._lastPosition.copy(pos) // Creates independent copy of values
```

**Performance Impact**:
- Without reusable vectors: 600+ allocations/second during touch gestures
- With reusable vectors: Near-zero allocations per frame

---

## IInputAdapter Pattern

The adapter interface decouples input handling from viewer implementation. It is `@internal` -- consumers interact through `IInputHandler` (the public API on `viewer.inputs`).

### Interface Definition

```typescript
interface IInputAdapter {
  init: () => void

  // Camera controls
  orbitCamera: (rotation: THREE.Vector2) => void
  rotateCamera: (rotation: THREE.Vector2) => void
  panCamera: (delta: THREE.Vector2) => void
  dollyCamera: (delta: THREE.Vector2) => void
  moveCamera: (velocity: THREE.Vector3) => void

  // Camera actions
  toggleOrthographic: () => void
  resetCamera: () => void
  frameCamera: () => void | Promise<void>

  // Interaction
  selectAtPointer: (pos: THREE.Vector2, add: boolean) => void | Promise<void>
  frameAtPointer: (pos: THREE.Vector2) => void | Promise<void>
  zoom: (value: number, screenPos?: THREE.Vector2) => void | Promise<void>

  // Touch
  pinchStart: (screenPos: THREE.Vector2) => void | Promise<void>
  pinchZoom: (totalRatio: number) => void

  // Selection
  clearSelection: () => void

  // Raw events (for custom handling)
  keyDown: (keyCode: string) => boolean
  keyUp: (keyCode: string) => boolean
  pointerDown: (pos: THREE.Vector2, button: number) => void
  pointerMove: (pos: THREE.Vector2) => void
  pointerUp: (pos: THREE.Vector2, button: number) => void
}
```

### WebGL Implementation

Direct THREE.js camera manipulation:

```typescript
function createAdapter(viewer: Viewer): IInputAdapter {
  return {
    orbitCamera: (rotation: THREE.Vector2) => {
      viewer.camera.snap().orbit(rotation)
    },

    zoom: async (value: number, screenPos?: THREE.Vector2) => {
      if (screenPos) {
        // Zoom towards point under cursor
        const result = await viewer.raycaster.raycastFromScreen(screenPos)
        if (result?.worldPosition) {
          viewer.camera.lerp(0.25).zoomTowards(value, result.worldPosition, screenPos)
          return
        }
      }
      // Fallback: zoom towards current target
      viewer.camera.lerp(0.75).zoom(value)
    },

    pinchStart: async (screenPos: THREE.Vector2) => {
      // Raycast to find world point under pinch center
      const result = await viewer.raycaster.raycastFromScreen(screenPos)
      if (result?.worldPosition) {
        _pinchWorldPoint = result.worldPosition.clone()
        _pinchStartDist = viewer.camera.position.distanceTo(result.worldPosition)
      }
    }
  }
}
```

### Ultra Implementation

RPC calls to server-side renderer:

```typescript
function createAdapter(viewer: Viewer): IInputAdapter {
  return {
    orbitCamera: (rotation: THREE.Vector2) => {
      viewer.rpc.RPCOrbitEvent(rotation.x, rotation.y)
    },

    zoom: async (value: number, screenPos?: THREE.Vector2) => {
      // Ultra handles zoom server-side, screenPos not used
      viewer.rpc.RPCMouseScrollEvent(value >= 1 ? -1 : 1)
    },

    pinchZoom: (totalRatio: number) => {
      // Convert ratio to discrete scroll steps
      const logRatio = Math.log2(totalRatio)
      let steps: number
      if (Math.abs(logRatio) < 0.3) steps = 0
      else if (Math.abs(logRatio) < 0.7) steps = Math.sign(logRatio) * 1
      else if (Math.abs(logRatio) < 1.2) steps = Math.sign(logRatio) * 2
      else steps = Math.sign(logRatio) * 3

      if (steps !== 0) {
        viewer.rpc.RPCMouseScrollEvent(-steps)
      }
    }
  }
}
```

---

## Speed Settings

### Move Speed (WASD)

Exponential scaling via `Math.pow(1.25, moveSpeed)`:

```typescript
viewer.core.inputs.moveSpeed = 5  // 1.25^5 = 3.05x speed
viewer.core.inputs.moveSpeed = 0  // 1.25^0 = 1.0x (default)
viewer.core.inputs.moveSpeed = -5 // 1.25^-5 = 0.32x (slow)
```

**Range**: -10 to +10
- -10 -> 0.107x speed (very slow)
- 0 -> 1.0x speed (default)
- +10 -> 9.31x speed (very fast)

**Adjust via keyboard**:
- `+` or `NumpadAdd`: Increase speed
- `-` or `NumpadSubtract`: Decrease speed
- `Ctrl` + `Wheel`: Adjust speed via mouse wheel

### Other Speeds

```typescript
viewer.core.inputs.scrollSpeed   // Wheel zoom multiplier (default: 1.75)
```

Note: `rotateSpeed` (LOOK mode) and `orbitSpeed` (ORBIT mode) are internal to `InputHandler` and not exposed on the public `IInputHandler` interface.

---

## Common Patterns

### Plan View Setup

Lock to top-down orthographic view with pan-only interaction:

```typescript
// Set camera to top-down
viewer.camera.snap().orbitTowards(new VIM.THREE.Vector3(0, 0, -1))

// Lock rotation
viewer.camera.lockRotation = new VIM.THREE.Vector2(0, 0)

// Enable orthographic projection
viewer.camera.orthographic = true

// Switch to pan mode
viewer.core.inputs.pointerMode = VIM.Core.PointerMode.PAN
```

### Custom Tool Mode

Implement a custom rectangle selection tool using the `override()` pattern:

```typescript
const inputs = viewer.core.inputs
const originalMode = inputs.pointerMode

// Enter tool mode
inputs.pointerMode = VIM.Core.PointerMode.RECT
const restoreMouse = inputs.mouse.override({
  onClick: (original, pos, ctrl) => {
    // Custom rectangle selection logic
    startRectangle(pos)
  }
})

// Exit tool mode
const exitTool = () => {
  inputs.pointerMode = originalMode
  restoreMouse()
}
```

### Multi-Key Bindings

Register the same action for multiple keys:

```typescript
// Speed controls
const restoreSpeedUp = viewer.core.inputs.keyboard.override(
  ['Equal', 'NumpadAdd'],
  'up',
  () => viewer.core.inputs.moveSpeed++
)

const restoreSpeedDown = viewer.core.inputs.keyboard.override(
  ['Minus', 'NumpadSubtract'],
  'up',
  () => viewer.core.inputs.moveSpeed--
)
```

### Custom Touch Gestures

Override default pinch behavior:

```typescript
const restoreTouch = viewer.core.inputs.touch.override({
  onPinchOrSpread: (original, ratio) => {
    // Custom zoom logic
    const zoomAmount = Math.log2(ratio) * 0.5
    viewer.camera.snap().zoom(1 + zoomAmount)
  },
  onDoubleTap: (original, pos) => {
    // Custom double-tap action
    original(pos) // or replace entirely
  }
})
// Later: restoreTouch()
```

### Disable Specific Inputs

```typescript
// Disable keyboard
viewer.core.inputs.keyboard.active = false

// Disable mouse
viewer.core.inputs.mouse.active = false

// Disable touch
viewer.core.inputs.touch.active = false

// Re-enable
viewer.core.inputs.keyboard.active = true
viewer.core.inputs.mouse.active = true
viewer.core.inputs.touch.active = true
```

---

## Extension Points

### Custom Key Handlers

```typescript
// Override a key (returns restore function)
const restore = viewer.core.inputs.keyboard.override('KeyR', 'down', () => {
  console.log('R key pressed')
})

// Chain with the previous handler
viewer.core.inputs.keyboard.override('KeyR', 'down', (original) => {
  original?.()
  console.log('This runs after the previous handler')
})

// Run before the previous handler
viewer.core.inputs.keyboard.override('KeyR', 'down', (original) => {
  console.log('This runs before the previous handler')
  original?.()
})
```

### Custom Mouse Callbacks

All callbacks receive canvas-relative positions [0-1]. Use `override()` which returns a restore function:

```typescript
const restore = viewer.core.inputs.mouse.override({
  // Override click behavior
  onClick: (original, pos, ctrl) => {
    if (ctrl) {
      // Custom Ctrl+Click action
    } else {
      original(pos, ctrl) // Fall through to default
    }
  },

  // Override drag behavior
  onDrag: (original, delta, button) => {
    if (button === 0) {
      console.log('Drag delta:', delta)
    }
    original(delta, button)
  },

  // Override pointer down/up
  onPointerDown: (original, pos, button) => {
    console.log('Pointer down:', button, 'at', pos)
    original(pos, button)
  },

  onPointerUp: (original, pos, button) => {
    console.log('Pointer up:', button, 'at', pos)
    original(pos, button)
  }
})

// Later: restore()
```

### Custom Pointer Modes

Use pointer modes with mouse override for custom tools:

```typescript
// Save current mode
const originalMode = viewer.core.inputs.pointerMode

// Enter custom mode
viewer.core.inputs.pointerMode = VIM.Core.PointerMode.RECT

// Override drag behavior for this mode
const restoreDrag = viewer.core.inputs.mouse.override({
  onDrag: (original, delta, button) => {
    if (viewer.core.inputs.pointerMode === VIM.Core.PointerMode.RECT) {
      updateRectangle(delta)
    } else {
      original(delta, button)
    }
  }
})

// Exit custom mode
viewer.core.inputs.pointerMode = originalMode
restoreDrag()
```

---

## Debugging

### Input State Inspection

```typescript
const inputs = viewer.core.inputs

// Check current mode
console.log('Active mode:', inputs.pointerMode)
console.log('Override:', inputs.pointerOverride)

// Check speeds
console.log('Move speed:', inputs.moveSpeed)
console.log('Scroll speed:', inputs.scrollSpeed)
```

### Event Logging

```typescript
// Log all pointer mode changes
viewer.core.inputs.onPointerModeChanged.subscribe(() => {
  console.log('Mode changed:', viewer.core.inputs.pointerMode)
})

// Log all clicks via override
const restore = viewer.core.inputs.mouse.override({
  onClick: (original, pos, ctrl) => {
    console.log('Click at:', pos, 'Ctrl:', ctrl)
    original(pos, ctrl)
  }
})
```

---

## Constants Reference

From `inputConstants.ts`:

```typescript
// Click detection
CLICK_MOVEMENT_THRESHOLD = 0.003        // Canvas-relative units [0-1]

// Double-click detection
DOUBLE_CLICK_DISTANCE_THRESHOLD = 0.005 // Canvas-relative units [0-1] (~5px on 1000px canvas)
DOUBLE_CLICK_TIME_THRESHOLD = 300       // Milliseconds

// Touch detection
TAP_DURATION_MS = 500                   // Maximum tap duration
TAP_MOVEMENT_THRESHOLD = 5              // Pixels

// Move speed range
MIN_MOVE_SPEED = -10                    // 1.25^-10 = 0.107x
MAX_MOVE_SPEED = 10                     // 1.25^10 = 9.31x
```

---

## Best Practices

1. **Always use `.copy()` when storing from temp vectors**
   ```typescript
   this._lastPosition.copy(pos)  // Correct
   this._lastPosition = pos      // WRONG: Stores reference
   ```

2. **Never store references to callback vectors**
   ```typescript
   // In an override handler:
   onClick: (original, pos) => {
     this.clickPos = pos.clone()  // Clone if storing
     this.clickPos = pos          // WRONG: Reference to temp vector
   }
   ```

3. **Use appropriate coordinate systems**
   - Canvas-relative [0-1] for raycasting and internal logic
   - Client pixels for UI positioning
   - World space for 3D operations

4. **Handle mode changes properly**
   ```typescript
   // Save original state
   const original = viewer.core.inputs.pointerMode

   // Change mode
   viewer.core.inputs.pointerMode = VIM.Core.PointerMode.PAN

   // Restore on exit
   viewer.core.inputs.pointerMode = original
   ```

5. **Always restore overrides**
   ```typescript
   // Override returns a restore function
   const restore = viewer.core.inputs.mouse.override({
     onClick: (original, pos, ctrl) => { /* custom */ }
   })

   // Restore on dispose
   restore()
   ```
