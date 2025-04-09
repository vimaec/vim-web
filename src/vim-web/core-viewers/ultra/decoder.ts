import { WebGLRenderer } from './streamRenderer'
import type { VideoFrameMessage } from './protocol'
import { ILogger } from './logger'

/**
 * Configuration for the video decoder.
 */
export const videoDecoderConfig: globalThis.VideoDecoderConfig = {
  // codec: 'avc1.420014', // Baseline
  // codec: 'avc1.4D0014', // Main
  codec: 'avc1.580014', // Extended
  codedWidth: 1280,
  codedHeight: 720
}

export enum VideoFrameType {
  // eslint-disable-next-line no-unused-vars
  KeyFrame = 0,
  // eslint-disable-next-line no-unused-vars
  DeltaFrame = 1
}

/**
 * Constant delay in milliseconds before starting frame rendering
 */
const RenderDelayMs = 500

/**
 * Interface defining the basic decoder operations
 */
export interface IDecoder {
  /** Indicates if the decoder is ready to process frames */
  ready: boolean;
  /** Indicates if the decoder is currently paused */
  paused: boolean;
  /** Stops the decoder operations */
  stop(): void;
  /** Starts the decoder operations */
  start(): void;
}

/**
 * Decoder class responsible for decoding video frames and rendering them using WebGL.
 * Handles frame queueing, decoding, and rendering through WebGL.
 */
export class Decoder implements IDecoder {
  private _decoder: globalThis.VideoDecoder | undefined
  private readonly _canvas: OffscreenCanvas
  private readonly _renderer: WebGLRenderer
  private readonly _logger: ILogger

  private _firstDecoded: boolean = false
  private _skipUntil: number = 0

  private _queue: VideoFrameMessage[] = []
  private _pendingFrame: globalThis.VideoFrame | undefined
  private _renderId: number | undefined
  private _decodeId: ReturnType<typeof setInterval> | undefined

  /**
   * Indicates whether the decoder is ready and configured.
   * @returns {boolean} True if the decoder is configured, false otherwise.
   */
  get ready (): boolean {
    return this._decoder?.state === 'configured'
  }

  /**
   * Creates an instance of the Decoder class.
   * @param originalCanvas - The original HTML canvas element to render frames onto
   * @param logger - Logger instance for debugging and error reporting
   * @throws {Error} When video decoder configuration is not supported
   */
  constructor (originalCanvas: HTMLCanvasElement, logger: ILogger) {
    this._logger = logger
    this._canvas = originalCanvas.transferControlToOffscreen()
    this._renderer = new WebGLRenderer(this._canvas)

    // Initialize the video decoder asynchronously
    globalThis.VideoDecoder.isConfigSupported(videoDecoderConfig)
      .then((v) => {
        if (v.supported === true) {
          // eslint-disable-next-line no-undef
          this._decoder = new VideoDecoder({
            output: (c) => { this.renderFrame(c) },
            error: (e) => { this._logger.log(e.message) }
          })
          this._decoder.configure(videoDecoderConfig)
          this._logger.log('Decoder initialized')
        } else {
          this._logger.log('The codec is not supported')
        }
      })
      .catch((e) => {
        this._logger.log(e.message)
      })
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
    if (!this._firstDecoded) {
      this._skipUntil = performance.now() + RenderDelayMs
    }
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
   * If a key frame is received, the queue is cleared except for the first frame
   * to maintain decoder stability.
   * @param frame - The video frame message to be queued for decoding
   */
  public enqueue (frame: VideoFrameMessage): void {
    if (frame.header.frameType === VideoFrameType.KeyFrame && this._queue.length > 0) {
      // We keep the first frame of the stream because otherwise the decoder will error
      this._queue.length = this._firstDecoded ? 0 : 1
    }
    this._queue.push(frame)
  }

  /**
   * Processes and decodes all queued video frame messages.
   * Skips processing if the decoder isn't ready or the queue is empty.
   * @throws {Error} When decoding fails for a video chunk
   */
  public decode (): void {
    if (!this.ready) return
    if (this._queue.length === 0) return
    const msgs = [...this._queue]
    this._queue.length = 0

    for (const message of msgs) {
      const chunk = this.createChunk(message)
      try {
        this._decoder?.decode(chunk)
      } catch (e) {
        this._logger.error('Error decoding video chunk: ', e)
      }
    }

    if(!this._firstDecoded)
    {
      this._firstDecoded = true
      this._logger.log('First frame decoded')
    }
  }

  /**
   * Clears the decoder state and renderer buffer.
   * Does not close the decoder instance.
   */
  clear (): void {
    this._logger.log('Clearing Decoder')
    this._cleanUp()
  }

  /**
   * Completely disposes of the decoder instance and releases all resources.
   * Should be called when the decoder is no longer needed.
   */
  dispose (): void {
    this._logger.log('Disposing Decoder')
    this._cleanUp()
    this._decoder?.close()
  }

  /**
   * Cleans up internal resources and cancels ongoing operations.
   * @private
   */
  private _cleanUp (): void {
    this._renderer.clear()
    this._queue.length = 0
  }

  /**
   * Creates an EncodedVideoChunk from a VideoFrameMessage.
   * @param message - The video frame message to convert
   * @returns {EncodedVideoChunk} A chunk ready for decoder processing
   * @private
   */
  // eslint-disable-next-line no-undef
  private createChunk (message: VideoFrameMessage): globalThis.EncodedVideoChunk {
    const init: globalThis.EncodedVideoChunkInit = {
      type: message.header.frameType === VideoFrameType.KeyFrame ? 'key' : 'delta',
      data: message.dataBuffer,
      timestamp: message.header.timestamp,
      duration: message.header.duration
    }

    // eslint-disable-next-line no-undef
    return new EncodedVideoChunk(init)
  }

  /**
   * Handles the animation loop for continuous frame rendering.
   * Processes pending frames and manages the render timing.
   * @private
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
   * Processes a decoded video frame for rendering.
   * Manages frame replacement and cleanup of previous frames.
   * @param frame - The decoded video frame ready for rendering
   * @private
   */
  private renderFrame (frame: globalThis.VideoFrame): void {
    if (this._pendingFrame !== undefined) {
      this._pendingFrame.close()
    }
    this._pendingFrame = frame
  }
}
