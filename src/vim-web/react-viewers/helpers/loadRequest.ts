import * as Core from '../../core-viewers'
import { LoadingError } from '../webgl/loading'
import { ControllablePromise } from '../../utils'

type RequestCallbacks = {
  onProgress: (p: Core.Webgl.IProgressLogs) => void
  onError: (e: LoadingError) => void
  onDone: () => void
}

/**
 * Class to handle loading a request.
 */
export class LoadRequest {
  readonly source
  private _callbacks : RequestCallbacks
  private _request: Core.Webgl.VimRequest
  private _onLoaded?: (vim: Core.Webgl.Vim) => void

  private _progress: Core.Webgl.IProgressLogs = { loaded: 0, total: 0, all: new Map() }
  private _progressPromise = new ControllablePromise<void>()

  private _isDone: boolean = false
  private _completionPromise = new ControllablePromise<void>()

  constructor (
    callbacks: RequestCallbacks,
    source: Core.Webgl.RequestSource,
    settings: Core.Webgl.VimPartialSettings,
    vimIndex: number,
    onLoaded?: (vim: Core.Webgl.Vim) => void
  ) {
    this.source = source
    this._callbacks = callbacks
    this._onLoaded = onLoaded
    this.startRequest(source, settings, vimIndex)
  }

  private async startRequest (source: Core.Webgl.RequestSource, settings: Core.Webgl.VimPartialSettings, vimIndex: number) {
    this._request = Core.Webgl.request(source, settings, vimIndex)
    for await (const progress of this._request.getProgress()) {
      this.onProgress(progress)
    }
    const result = await this._request.getResult()
    if (result.isError()) {
      this.onError(result.error)
    } else {
      this._onLoaded?.(result.result)
      this.onSuccess()
    }
  }

  private onProgress (progress: Core.Webgl.IProgressLogs) {
    this._callbacks.onProgress(progress)
    this._progress = progress
    this._progressPromise.resolve()
    this._progressPromise = new ControllablePromise<void>()
  }

  private onSuccess () {
    this._callbacks.onDone()
    this.end()
  }

  private onError (error: string) {
    this._callbacks.onError({
      url: this.source.url,
      error
    })
    this.end()
  }

  private end () {
    this._isDone = true
    this._progressPromise.resolve()
    this._completionPromise.resolve()
  }

  async * getProgress () : AsyncGenerator<Core.Webgl.IProgressLogs, void, void> {
    while (!this._isDone) {
      await this._progressPromise.promise
      yield this._progress
    }
  }

  async getResult () {
    await this._completionPromise
    return this._request.getResult()
  }

  /**
   * Convenience method to get the vim directly.
   * Throws if loading failed.
   */
  async getVim (): Promise<Core.Webgl.Vim> {
    const result = await this.getResult()
    if (result.isError()) {
      throw new Error(result.error)
    }
    return result.result
  }

  abort () {
    this._request.abort()
    this.onError('Request aborted')
  }
}
