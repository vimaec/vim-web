import { SignalDispatcher } from 'ste-signals'
import { SimpleEventDispatcher } from 'ste-simple-events'
import * as THREE from 'three'
import { BaseInputHandler } from './baseInputHandler'
import { KeyboardHandler } from './keyboardHandler'
import { MouseHandler } from './mouseHandler'
import { TouchHandler } from './touchHandler'
import { IInputAdapter } from './inputAdapter'

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
  rotateSpeed: number
  orbitSpeed: number
}

export class InputHandler extends BaseInputHandler {

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

  private _pointerActive: PointerMode = PointerMode.ORBIT
  private _pointerFallback: PointerMode = PointerMode.LOOK
  private _pointerOverride: PointerMode | undefined
  private _onPointerOverrideChanged = new SignalDispatcher()
  private _onPointerModeChanged = new SignalDispatcher()
  private _onSettingsChanged = new SignalDispatcher()
  private _adapter : IInputAdapter

  constructor (canvas: HTMLCanvasElement, adapter: IInputAdapter, settings: Partial<InputSettings> = {}) {
    super(canvas)
    this._adapter = adapter

    this._pointerActive = (settings.orbit === undefined || settings.orbit) ? PointerMode.ORBIT : PointerMode.LOOK
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
    this.touch = new TouchHandler(canvas)

    // Keyboard controls
    this.keyboard.onKeyDown = (key: string) => adapter.keyDown(key)
    this.keyboard.onKeyUp = (key: string) => adapter.keyUp(key)

    this.keyboard.registerKeyUp('KeyP', 'replace', () => adapter.toggleOrthographic());
    this.keyboard.registerKeyUp('Equal', 'replace', () => this.moveSpeed++);
    this.keyboard.registerKeyUp('Minus', 'replace', () => this.moveSpeed--);
    this.keyboard.registerKeyUp('Space', 'replace', () => adapter.toggleCameraOrbitMode());
    this.keyboard.registerKeyUp('Home', 'replace', () => adapter.resetCamera());
    this.keyboard.registerKeyUp('Escape', 'replace', () => adapter.clearSelection());
    this.keyboard.registerKeyUp('KeyF', 'replace', () => {
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
        if(this._pointerActive === PointerMode.ORBIT) adapter.orbitCamera(toRotation(delta, this.orbitSpeed))
        if(this._pointerActive === PointerMode.LOOK) adapter.rotateCamera(toRotation(delta, this.rotateSpeed))
        if(this._pointerActive === PointerMode.PAN) adapter.panCamera(delta)
        if(this._pointerActive === PointerMode.ZOOM) adapter.dollyCamera(delta)
      } 
      if(button === 2) adapter.rotateCamera(toRotation(delta,1))
      if(button === 1) adapter.panCamera(delta)
    }

    this.mouse.onClick = (pos: THREE.Vector2, modif: boolean) => adapter.selectAtPointer(pos, modif)
    this.mouse.onDoubleClick = adapter.frameAtPointer
    this.mouse.onWheel = (value: number, ctrl: boolean) => {
      if(ctrl){
        console.log('ctrl', value)
        this.moveSpeed -= Math.sign(value)
      }
      else{
        adapter.zoom(this.getZoomValue(value))
      }
    }

    // Touch controls
    this.touch.onTap = (pos: THREE.Vector2) => adapter.selectAtPointer(pos, false)
    this.touch.onDoubleTap = adapter.frameAtPointer
    this.touch.onDrag = (delta: THREE.Vector2) => adapter.orbitCamera(delta)
    this.touch.onPinchOrSpread = adapter.zoom
    this.touch.onDoubleDrag = (value : THREE.Vector2) => adapter.panCamera(value)
  }

  getZoomValue (value: number) {
    return Math.pow(this.scrollSpeed, value)
  }

  init(){
    this.registerAll()
    this._adapter.init()
  }

  get moveSpeed () {
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
    if (value === this._pointerActive) return
    this._pointerActive = value
    this._onPointerModeChanged.dispatch()
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