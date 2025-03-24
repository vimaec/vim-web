import { debounce } from "../../utils/debounce"
import { ILogger } from "./logger";
import { RpcSafeClient } from "./rpcSafeClient";

/**
 * Interface defining viewport functionality
 */
export interface IViewport {
  /** The HTML canvas element used for rendering */
  canvas: HTMLCanvasElement
  /** Updates the aspect ratio of the viewport on the server */
  update(): void
}

/**
 * Class managing the viewport and canvas resizing functionality
 */
export class Viewport {
  /** The HTML canvas element used for rendering */
  canvas: HTMLCanvasElement
  private _rpc: RpcSafeClient
  private _logger: ILogger
  private _observer: ResizeObserver
  private _clearTimeout: () => void

  /**
   * Creates a new Viewport instance
   * @param canvas - The HTML canvas element to observe and manage
   * @param rpc - RPC client for viewport communication
   */
  constructor(canvas: HTMLCanvasElement, rpc: RpcSafeClient, logger: ILogger) {
    this.canvas = canvas
    this._rpc = rpc
    this._logger = logger

    const [debounced, clear] = debounce(() => this.onResize(), 250)
    this._observer = new ResizeObserver(debounced)
    this._observer.observe(canvas)
    this._clearTimeout = clear
  }

  /**
   * Handles resize events for the canvas
   * @private
   */
  private onResize() {
    this._logger.log('Canvas resized to :',{x: this.canvas.offsetWidth, y:this.canvas.offsetHeight})
    this.update()
  }

  /**
   * Updates the aspect ratio of the viewport on the server
   */
  update() {
    if(this._rpc.connected){
      this._rpc.RPCSetAspectRatio(this.canvas.offsetWidth, this.canvas.offsetHeight)
    }
  }

  /**
   * Cleans up resources by removing resize observer and clearing timeouts
   */
  dispose() {
    this._clearTimeout()
    this._observer.disconnect()
  }
}

