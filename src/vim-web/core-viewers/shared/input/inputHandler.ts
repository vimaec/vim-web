/**
 * Input coordinator that routes device events to viewer-specific adapters.
 *
 * See INPUT.md for architecture, pointer modes, and customization patterns.
 */

import { ISignal, SignalDispatcher } from 'ste-signals'
import { ISimpleEvent, SimpleEventDispatcher } from 'ste-simple-events'
import * as THREE from 'three'
import { KeyboardHandler, type IKeyboardInput } from './keyboardHandler'
import { MouseHandler, type IMouseInput } from './mouseHandler'
import { TouchHandler, type ITouchInput } from './touchHandler'
import { IInputAdapter } from './inputAdapter'
import { MIN_MOVE_SPEED, MAX_MOVE_SPEED } from './inputConstants'
import { canvasToClient } from './coordinates'

/** Base multiplier for exponential move speed scaling (1.25^moveSpeed) */
const MOVE_SPEED_BASE = 1.25

/**
 * Determines how left-drag (mouse) or single-finger drag (touch) is interpreted.
 *
 * - `ORBIT` — Rotate camera around its target point.
 * - `LOOK` — Rotate camera in place (first-person).
 * - `PAN` — Slide camera laterally.
 * - `ZOOM` — Dolly camera forward/backward.
 * - `RECT` — Rectangle selection (reserved).
 */
export enum PointerMode {
  ORBIT = 'orbit',
  LOOK = 'look',
  PAN = 'pan',
  ZOOM = 'zoom',
  RECT = 'rect'
}

interface InputSettings{
  orbit: boolean
  scrollSpeed: number
  moveSpeed: number
}

/**
 * Public API for the input system, accessed via `viewer.inputs`.
 *
 * Provides access to the three device handlers (keyboard, mouse, touch),
 * pointer mode control, and speed settings.
 *
 * @example
 * ```ts
 * // Change pointer mode to pan
 * viewer.inputs.pointerMode = PointerMode.PAN
 *
 * // Override a keyboard binding
 * const restore = viewer.inputs.keyboard.override('KeyF', 'up', () => myFrameLogic())
 * // Later: restore()
 *
 * // Override mouse click behavior
 * const restore = viewer.inputs.mouse.override({
 *   onClick: (pos, ctrl, original) => { myLogic(pos); original(pos, ctrl) }
 * })
 * ```
 */
export interface IInputHandler {
  /** Keyboard input handler. Override key bindings via {@link IKeyboardInput.override}. */
  keyboard: IKeyboardInput
  /** Mouse input handler. Override callbacks via {@link IMouseInput.override}. */
  mouse: IMouseInput
  /** Touch input handler. Override callbacks via {@link ITouchInput.override}. */
  touch: ITouchInput

  /** The active pointer mode controlling how left-drag is interpreted. */
  pointerMode: PointerMode
  /** Temporary pointer mode during drag (e.g., right-drag = LOOK). Read-only. */
  readonly pointerOverride: PointerMode | undefined
  /** Fires when {@link pointerMode} or {@link pointerOverride} changes. */
  readonly onPointerModeChanged: ISignal

  /** WASD move speed. Exponential scale: actual speed = 1.25^moveSpeed. Range: [-10, +10]. */
  moveSpeed: number
  /** Scroll wheel zoom speed. Higher = faster zoom per scroll tick. */
  scrollSpeed: number
  /** Fires when any speed setting changes (moveSpeed, scrollSpeed). */
  readonly onSettingsChanged: ISignal

  /** Fires when a right-click context menu should be shown. Payload is client-space position. */
  readonly onContextMenu: ISimpleEvent<THREE.Vector2 | undefined>
}

/**
 * Input handler coordinator.
 *
 * Manages two-tier pointer modes (active/override).
 * See INPUT.md for mode system and customization.
 */
export class InputHandler implements IInputHandler {

  private _canvas: HTMLCanvasElement
  private _touch: TouchHandler
  private _mouse: MouseHandler
  private _keyboard: KeyboardHandler

  get touch(): ITouchInput { return this._touch }
  get mouse(): IMouseInput { return this._mouse }
  get keyboard(): IKeyboardInput { return this._keyboard }

  private _scrollSpeed: number
  private _rotateSpeed: number = 1
  private _orbitSpeed: number = 1
  private _moveSpeed: number

  private _pointerMode: PointerMode = PointerMode.ORBIT
  private _pointerOverride: PointerMode | undefined
  private _onPointerModeChanged = new SignalDispatcher()
  private _onSettingsChanged = new SignalDispatcher()
  private _adapter : IInputAdapter

  constructor (canvas: HTMLCanvasElement, adapter: IInputAdapter, settings: Partial<InputSettings> = {}) {
    this._canvas = canvas
    this._adapter = adapter

    this._pointerMode = (settings.orbit === undefined || settings.orbit) ? PointerMode.ORBIT : PointerMode.LOOK
    this._scrollSpeed = settings.scrollSpeed ?? 1.75
    this._moveSpeed = settings.moveSpeed ?? 1

    this._keyboard = new KeyboardHandler(canvas, {
      onKeyDown: (key: string) => adapter.keyDown(key),
      onKeyUp: (key: string) => adapter.keyUp(key),
      onMove: (value: THREE.Vector3) => {
        const mul = Math.pow(MOVE_SPEED_BASE, this._moveSpeed)
        adapter.moveCamera(value.multiplyScalar(mul))
      },
    })

    this._keyboard.override('KeyP', 'up', () => adapter.toggleOrthographic());
    this._keyboard.override(['Equal', 'NumpadAdd'], 'up', () => this.moveSpeed++);
    this._keyboard.override(['Minus', 'NumpadSubtract'], 'up', () => this.moveSpeed--);
    this._keyboard.override('Home', 'up', () => adapter.resetCamera());
    this._keyboard.override('Escape', 'up', () => adapter.clearSelection());
    this._keyboard.override('KeyF', 'up', () => adapter.frameCamera());

    this._mouse = new MouseHandler(canvas, {
      onClick: (pos: THREE.Vector2, modif: boolean) => adapter.selectAtPointer(pos, modif),
      onDoubleClick: adapter.frameAtPointer,
      onDrag: (delta: THREE.Vector2, button: number) => {
        if(button === 0){
          if(this.pointerMode === PointerMode.ORBIT) adapter.orbitCamera(toRotation(delta, this._orbitSpeed))
          if(this.pointerMode === PointerMode.LOOK) adapter.rotateCamera(toRotation(delta, this._rotateSpeed))
          if(this.pointerMode === PointerMode.PAN) adapter.panCamera(delta)
          if(this.pointerMode === PointerMode.ZOOM) adapter.dollyCamera(delta)
        }
        if(button === 2){
          this._setPointerOverride(PointerMode.LOOK)
          adapter.rotateCamera(toRotation(delta,1))
        }
        if(button === 1){
          this._setPointerOverride(PointerMode.PAN)
          adapter.panCamera(delta)
        }
      },
      onPointerDown: adapter.pointerDown,
      onPointerUp: (pos: THREE.Vector2, button: number) => {
        this._setPointerOverride(undefined)
        adapter.pointerUp(pos, button)
      },
      onPointerMove: adapter.pointerMove,
      onWheel: (value: number, ctrl: boolean, clientX: number, clientY: number) => {
        if(ctrl){
          this.moveSpeed -= Math.sign(value)
        }
        else{
          const rect = this._canvas.getBoundingClientRect()
          const screenX = (clientX - rect.left) / rect.width
          const screenY = (clientY - rect.top) / rect.height
          _tempScreenPos.set(screenX, screenY)
          adapter.zoom(this._getZoomValue(value), _tempScreenPos)
        }
      },
      onContextMenu: (pos: THREE.Vector2) => {
        canvasToClient(pos.x, pos.y, canvas, _tempClientPos)
        this._onContextMenu.dispatch(_tempClientPos)
      },
    })

    this._touch = new TouchHandler(canvas, {
      onTap: (pos: THREE.Vector2) => adapter.selectAtPointer(pos, false),
      onDoubleTap: adapter.frameAtPointer,
      onDrag: (delta: THREE.Vector2) => {
        if(this.pointerMode === PointerMode.ORBIT) adapter.orbitCamera(toRotation(delta, this._orbitSpeed))
        if(this.pointerMode === PointerMode.LOOK) adapter.rotateCamera(toRotation(delta, this._rotateSpeed))
        if(this.pointerMode === PointerMode.PAN) adapter.panCamera(delta)
        if(this.pointerMode === PointerMode.ZOOM) adapter.dollyCamera(delta)
      },
      onPinchStart: (center: THREE.Vector2) => adapter.pinchStart(center),
      onPinchOrSpread: (totalRatio: number) => adapter.pinchZoom(totalRatio),
      onDoubleDrag: (value: THREE.Vector2) => adapter.panCamera(value),
    })
  }

  private _getZoomValue (value: number) {
    return Math.pow(this._scrollSpeed, -value)
  }

  private _setPointerOverride (value: PointerMode | undefined) {
    if (value === this._pointerOverride) return
    this._pointerOverride = value
    this._onPointerModeChanged.dispatch()
  }

  init(){
    this.registerAll()
    this._adapter.init()
  }

  get moveSpeed () {
    return this._moveSpeed
  }

  set moveSpeed (value: number) {
    this._moveSpeed = Math.max(MIN_MOVE_SPEED, Math.min(MAX_MOVE_SPEED, value))
    this._onSettingsChanged.dispatch()
  }

  get scrollSpeed () { return this._scrollSpeed }
  set scrollSpeed (value: number) {
    this._scrollSpeed = value
    this._onSettingsChanged.dispatch()
  }

  get onSettingsChanged() {
    return this._onSettingsChanged.asEvent()
  }

  /**
   * Returns current pointer mode.
   */
  get pointerMode (): PointerMode {
    return this._pointerMode
  }

  /**
   * A temporary pointer mode during drag (e.g., right-drag = LOOK).
   */
  get pointerOverride (): PointerMode | undefined {
    return this._pointerOverride
  }

  /**
   * Changes pointer interaction mode.
   */
  set pointerMode (value: PointerMode) {
    if (value === this._pointerMode) return
    this._pointerMode = value
    this._onPointerModeChanged.dispatch()
  }

  /**
   * Event fired when pointer mode or pointer override changes.
   */
  get onPointerModeChanged () {
    return this._onPointerModeChanged.asEvent()
  }

  private _onContextMenu = new SimpleEventDispatcher<
    THREE.Vector2 | undefined
  >()

  /**
   * Event called when when context menu could be displayed
   */
  get onContextMenu () {
    return this._onContextMenu.asEvent()
  }

  /**
 * Register inputs handlers for default viewer behavior
 */
  registerAll () {
    this._keyboard.register()
    this._mouse.register()
    this._touch.register()
  }

  /**
   * Unregisters all input handlers
   */
  unregisterAll = () => {
    this._mouse.unregister()
    this._keyboard.unregister()
    this._touch.unregister()
  }

  /**
   * Resets all input state
   */
  resetAll () {
    this._mouse.reset()
    this._keyboard.reset()
    this._touch.reset()
  }

  dispose(){
    this.unregisterAll()
  }
}

// Reusable vectors to avoid per-frame allocations
const _tempRotation = new THREE.Vector2()
const _tempScreenPos = new THREE.Vector2()
const _tempClientPos = new THREE.Vector2()

function toRotation (delta: THREE.Vector2, speed: number) {
  return _tempRotation.copy(delta).negate().multiplyScalar(180 * speed)
}
