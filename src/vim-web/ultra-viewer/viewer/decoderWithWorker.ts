import { WebGLRenderer } from './streamRenderer'
import type { VideoFrameMessage } from './protocol'
import { ILogger } from './logger'
import DecoderWorker from './decoderWorker'

const RenderDelayMs = 500

export enum FrameType {
  // eslint-disable-next-line no-unused-vars
  KeyFrame = 0,
  // eslint-disable-next-line no-unused-vars
  DeltaFrame = 1
}

/**
 * Decoder class responsible for decoding video frames and rendering them using WebGL.
 */
export class DecoderWithWorker {
  private readonly _canvas: OffscreenCanvas
  private readonly _renderer: WebGLRenderer
  private readonly _logger: ILogger

  private _firstDecoded: boolean = false
  private _skipUntil: number = 0

  private _queue: VideoFrameMessage[] = []
  private _pendingFrame: globalThis.VideoFrame | undefined
  private _renderId: number | undefined
  private _decodeId: ReturnType<typeof setInterval> | undefined
  private _worker : Worker

  /**
   * Indicates whether the decoder is ready and configured.
   * @returns {boolean} True if the decoder is configured, false otherwise.
   */
  get ready (): boolean {
    return true
  }

  /**
   * Creates an instance of the Decoder class.
   * @param originalCanvas - The original HTML canvas element.
   * @param logger - Logger for logging messages and errors.
   */
  constructor (originalCanvas: HTMLCanvasElement, logger: ILogger) {
    this._logger = logger
    this._canvas = originalCanvas.transferControlToOffscreen()
    this._renderer = new WebGLRenderer(this._canvas)

    // Initialize the worker
    // main.ts or decoder.ts

    this._worker = new DecoderWorker()
    this._worker.postMessage({ type: 'init' })

    // Listen for decoded frames from the worker
    this._worker.onmessage = (event) => {
      const msg = event.data
      console.log('received message from worker', msg)
      if (msg.type === 'frame') {
        this.renderFrame(msg.frame)
      }
      if (msg.type === 'log') {
        this._logger.log(msg.message)
      }
    }
  }

  // Function to send frames to the worker
  sendFrameToWorker (frame: VideoFrameMessage) {
  // Transfer the dataBuffer to avoid copying
    // console.log('sending message to worker')
    this._worker.postMessage({
      type: 'frame',
      timestamp: frame.header.timestamp,
      duration: frame.header.duration,
      frameType: frame.header.frameType,
      data: frame.dataBuffer
    }, [frame.dataBuffer])
  }

  /**
   * Indicates whether the decoder is currently paused.
   * @returns {boolean} True if paused, false otherwise.
   */
  get paused (): boolean {
    return this._decodeId === undefined
  }

  /**
   * Pauses the decoder and renderer.
   */
  stop (): void {
    this._logger.log('Stopping Decoder')
    this._clearCallbacks()
  }

  /**
   * Resumes the decoder and renderer.
   */
  start (): void {
    // Make sure we are not running multiple decoders
    this._clearCallbacks()

    this._logger.log('Starting Decoder')
    this._decodeId = setInterval(() => { this.decode() }, 0)
    this._skipUntil = performance.now() + RenderDelayMs
    this.animate()
  }

  /**
   * Clears decoding and rendering callbacks.
   */
  private _clearCallbacks (): void {
    if (this._decodeId) {
      clearInterval(this._decodeId)
      this._decodeId = undefined
    }

    if (this._renderId) {
      cancelAnimationFrame(this._renderId)
      this._renderId = undefined
    }

    this._pendingFrame?.close()
    this._pendingFrame = undefined
  }

  /**
   * Enqueues a video frame message for decoding.
   * @param frame - The video frame message to enqueue.
   */
  public enqueue (frame: VideoFrameMessage): void {
    if (frame.header.frameType === FrameType.KeyFrame && this._queue.length > 0) {
      // We keep the first frame of the stream because otherwise the decoder will error
      this._queue.length = this._firstDecoded ? 0 : 1
    }
    this._queue.push(frame)
  }

  /**
   * Decodes enqueued video frame messages.
   */
  public decode (): void {
    if (!this.ready) return
    if (this._queue.length === 0) return
    const msgs = [...this._queue]
    this._queue.length = 0

    for (const message of msgs) {
      this.sendFrameToWorker(message)
    }
    this._firstDecoded = true
  }

  /**
   * Clears the decoder and renderer, resetting the internal state.
   */
  clear (): void {
    this._logger.log('Clearing Decoder')
    this._cleanUp()
  }

  /**
   * Disposes of the decoder, releasing resources.
   */
  dispose (): void {
    this._logger.log('Disposing Decoder')
    this._cleanUp()
  }

  /**
   * Cleans up the renderer and clears the frame queue.
   */
  private _cleanUp (): void {
    this._renderer.clear()
    this._queue.length = 0
  }

  /**
   * Animation loop for rendering frames.
   */
  private animate (): void {
    this._renderId = requestAnimationFrame(() => { this.animate() })
    if (this._pendingFrame !== undefined) {
      if (performance.now() > this._skipUntil) {
        this._renderer.draw(this._pendingFrame)
      }

      this._pendingFrame.close()
      this._pendingFrame = undefined
    }
  }

  /**
   * Handles rendering of a decoded video frame.
   * @param frame - The decoded video frame.
   */
  private renderFrame (frame: globalThis.VideoFrame): void {
    if (this._pendingFrame !== undefined) {
      this._pendingFrame.close()
    }
    this._pendingFrame = frame
  }
}
