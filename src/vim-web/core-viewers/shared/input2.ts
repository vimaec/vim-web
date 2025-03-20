import { Viewer } from '../webgl/viewer/viewer'
import { TouchHandler } from './touchHandler'
import { MouseHandler } from './mouseHandler'
import { KeyboardHandler } from './keyboardHandler'
import * as THREE from 'three'
import { SimpleEventDispatcher } from 'ste-simple-events'
import { SignalDispatcher } from 'ste-signals'
import { InputAction } from '../webgl/viewer/raycaster' 
import { InputHandler } from './inputHandler'

export type PointerMode = 'orbit' | 'look' | 'pan' | 'zoom' | 'rect'

export interface InputAdapter{
  init: () => void

  toggleOrthographic: () => void
  resetCamera: () => void
  clearSelection: () => void
  frameCamera: () => void
  moveCamera: (value: THREE.Vector3) => void
  orbitCamera: (value: THREE.Vector2) => void
  rotateCamera: (value: THREE.Vector2) => void
  panCamera: (value: THREE.Vector2) => void

  // Raw input handlers for Ultra
  keyDown: (keyCode: string) => boolean
  keyUp: (keyCode: string) => boolean
  mouseDown: (pos: THREE.Vector2, button: number) => void
  mouseUp: (pos: THREE.Vector2, button: number) => void
  mouseMove: (pos: THREE.Vector2) => void

  selectAtPointer: (pos: THREE.Vector2, add: boolean) => void
  frameAtPointer: (pos: THREE.Vector2) => void
  zoom: (value: number) => void
}

interface InputSettings{
  orbit: boolean
  scrollSpeed: number
  moveSpeed: number
  rotateSpeed: number
  orbitSpeed: number
}

export class Input2 extends InputHandler {



  /**
   * Touch input handler
   */
  touch: TouchHandler
  /**
   * Mouse input handler
   */
  mouse: MouseHandler
  /**
   * Keyboard input handler
   */
  keyboard: KeyboardHandler


  scrollSpeed: number = 1.6
  private _moveSpeed: number
  rotateSpeed: number
  orbitSpeed: number

  private _pointerActive: PointerMode = 'orbit'
  private _pointerFallback: PointerMode = 'look'
  private _pointerOverride: PointerMode | undefined
  private _onPointerOverrideChanged = new SignalDispatcher()
  private _onPointerModeChanged = new SignalDispatcher()
  private _onSettingsChanged = new SignalDispatcher()
  private _adapter : InputAdapter

  constructor (canvas: HTMLCanvasElement, adapter: InputAdapter, settings: Partial<InputSettings> = {}) {
    super(canvas)
    this._adapter = adapter

    this._pointerActive = (settings.orbit === undefined || settings.orbit) ? 'orbit' : 'look'
    this.scrollSpeed = settings.scrollSpeed ?? 1.6
    this._moveSpeed = settings.moveSpeed ?? 1
    this.rotateSpeed = settings.rotateSpeed ?? 1
    this.orbitSpeed = settings.orbitSpeed ?? 1

    this.reg(document, 'contextmenu', (e: MouseEvent) => {
      this._onContextMenu.dispatch(new THREE.Vector2(e.clientX, e.clientY))
      e.preventDefault()
    })
    this.keyboard = new KeyboardHandler(canvas)
    this.mouse = new MouseHandler(canvas)
    this.touch = new TouchHandler(canvas, undefined)

    // Keyboard controls
    this.keyboard.onKeyDown = (key: string) => adapter.keyDown(key)
    this.keyboard.onKeyUp = (key: string) => adapter.keyUp(key)

    this.keyboard.registerKeyUp('KeyP', () => adapter.toggleOrthographic());
    this.keyboard.registerKeyUp('Equal', () => this.moveSpeed++);
    this.keyboard.registerKeyUp('Minus', () => this.moveSpeed--);
    this.keyboard.registerKeyUp('Space', () => {
      this._pointerActive = this._pointerActive === 'orbit' ? 'look' : 'orbit';
      this._pointerFallback = this._pointerActive;
      this._onPointerModeChanged.dispatch();
    });
    this.keyboard.registerKeyUp('Home', () => adapter.resetCamera());
    this.keyboard.registerKeyUp('Escape', () => adapter.clearSelection());
    this.keyboard.registerKeyUp('KeyF', () => {
      adapter.frameCamera();
    });

    this.keyboard.onMove = (value: THREE.Vector3 ) =>{
      const mul = Math.pow(1.25, this._moveSpeed)
      adapter.moveCamera(value.multiplyScalar(mul))
    } 

    // Mouse controls
    this.mouse.onButtonDown = adapter.mouseDown
    this.mouse.onMouseMove = adapter.mouseMove
    this.mouse.onButtonUp = adapter.mouseUp
    this.mouse.onDrag = (delta: THREE.Vector2, button: number) =>{
      if(button === 0){
        if(this._pointerActive === 'orbit') adapter.orbitCamera(toRotation(delta, this.orbitSpeed))
        if(this._pointerActive === 'look') adapter.rotateCamera(toRotation(delta, this.rotateSpeed))
      } 
      if(button === 2) adapter.rotateCamera(toRotation(delta,1))
      if(button === 1) adapter.panCamera(delta)
    }
  

    this.mouse.onClick = (pos: THREE.Vector2, modif: boolean) => adapter.selectAtPointer(pos, modif)
    this.mouse.onDoubleClick = adapter.frameAtPointer
    this.mouse.onWheel = (value: number, ctrl: boolean) => {

      if(ctrl){
        this.moveSpeed -= Math.sign(value)
      }
      else{
        console.log('zoom', value)
        const zoom = Math.pow(this.scrollSpeed, value)
        console.log('zoom+', zoom)
        adapter.zoom(zoom)
      }
    }

    // Touch controls
    this.touch.onTap = (pos: THREE.Vector2) => adapter.selectAtPointer(pos, false)
    this.touch.onDoubleTap = adapter.frameAtPointer
    this.touch.onDrag = (delta: THREE.Vector2) => adapter.orbitCamera(delta)
    this.touch.onPinchOrSpread = adapter.zoom
    this.touch.onDoubleDrag = (value : THREE.Vector2) => adapter.panCamera(value)
  }

  init(){
    this.registerAll()
    this._adapter.init()
  }

  MainAction (action: InputAction): void {
    console.log('onMainAction', action)
  }

  IdleAction (hit: InputAction): void {
    console.log('onIdleAction', hit)
  }

  KeyAction (key: number): boolean {
    console.log('onKeyAction', key)
    return false
  }

  get moveSpeed () {
    console.log('get moveSpeed', this._moveSpeed)
    return this._moveSpeed
  }

  set moveSpeed (value: number) {
    this._moveSpeed = value
    this._onSettingsChanged.dispatch()
  }

  get onSettingsChanged() {
    return this._onSettingsChanged.asEvent()
  }

  /**
   * Returns the last main mode (orbit, look) that was active.
   */
  get pointerFallback () : PointerMode {
    return this._pointerFallback
  }

  /**
   * Returns current pointer mode.
   */
  get pointerActive (): PointerMode {
    return this._pointerActive
  }

  /**
   * A temporary pointer mode used for temporary icons.
   */
  get pointerOverride (): PointerMode {
    return this._pointerOverride
  }

  set pointerOverride (value: PointerMode | undefined) {
    if (value === this._pointerOverride) return
    this._pointerOverride = value
    this._onPointerOverrideChanged.dispatch()
  }

  /**
   * Changes pointer interaction mode. Look mode will set camera orbitMode to false.
   */
  set pointerActive (value: PointerMode) {
    console.log('set pointerActive', value)
  }


  /**
   * Event called when pointer interaction mode changes.
   */
  get onPointerModeChanged () {
    return this._onPointerModeChanged.asEvent()
  }


  /**
   * Event called when the pointer is temporarily overriden.
   */
  get onPointerOverrideChanged () {
    return this._onPointerOverrideChanged.asEvent()
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
   * Calls context menu action
   */
  ContextMenu (position: THREE.Vector2 | undefined) {
    this._onContextMenu.dispatch(position)
  }


  /**
 * Register inputs handlers for default viewer behavior
 */
  registerAll () {
    this.keyboard.register()
    this.mouse.register()
    this.touch.register()
  }

  /**
   * Unregisters all input handlers
   */
  unregisterAll = () => {
    this.mouse.unregister()
    this.keyboard.unregister()
    this.touch.unregister()
  }

  /**
   * Resets all input state
   */
  resetAll () {
    this.mouse.reset()
    this.keyboard.reset()
    this.touch.reset()
  }

  dispose(){
    this.unregisterAll()
  }
}

  function toRotation (delta: THREE.Vector2, speed: number) {
    const rot = delta.clone()
    rot.x = -delta.y
    rot.y = -delta.x
    rot.multiplyScalar(180 * speed)
    return rot
  }