/**
 * @module viw-webgl-viewer/inputs
 */

import { WebglCoreViewer } from '../webgl/viewer/viewer'

/**
 * TODO: Use the same code for ULTRA and webgl.
 * Base class for various input handlers.
 * It provides convenience to register to and unregister from events.
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
    callback: (event: T) => void
  ): void {
    const f = (e: Event): void => { callback(e as T); };
    element.addEventListener(eventType, f);
    this._disconnect.push(() => { element.removeEventListener(eventType, f); });
  }

  /**
   * Register handler to related browser events
   * Prevents double registrations
   */
  register () {
    if (this._disconnect.length > 0) return
    this.addListeners()
  }

  protected addListeners () {}

  /**
   * Unregister handler from related browser events
   * Prevents double unregistration
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
