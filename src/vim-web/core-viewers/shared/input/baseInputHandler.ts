/**
 * @module viw-webgl-viewer/inputs
 */

/**
 * Base class for various input handlers.
 * It provides convenience to register to and unregister from events.
 * @internal
 */
export class BaseInputHandler {
  protected _canvas: HTMLCanvasElement
  protected _disconnect: Function[] = []

  constructor (canvas: HTMLCanvasElement) {
    this._canvas = canvas
  }

  // Helper to unregister all event listeners
  protected reg<T extends Event>(
    element: Document | HTMLElement | Window,
    eventType: string,
    callback: (event: T) => void,
    options?: AddEventListenerOptions
  ): void {
    const f = (e: Event): void => { callback(e as T); };
    element.addEventListener(eventType, f, options);
    this._disconnect.push(() => { element.removeEventListener(eventType, f, options); });
  }

  /**
   * Whether this handler is actively listening to browser events.
   */
  get active (): boolean {
    return this._disconnect.length > 0
  }

  set active (value: boolean) {
    if (value) this.register()
    else this.unregister()
  }

  /**
   * Register handler to related browser events.
   * Prevents double registrations.
   */
  register () {
    if (this._disconnect.length > 0) return
    this.addListeners()
  }

  protected addListeners () {}

  /**
   * Unregister handler from related browser events.
   * Prevents double unregistration.
   */
  unregister () {
    this._disconnect.forEach((f) => f())
    this._disconnect.length = 0
    this.reset()
  }

  /**
   * Reset handler states such as button down, drag, etc.
   */
  reset () {}
}
