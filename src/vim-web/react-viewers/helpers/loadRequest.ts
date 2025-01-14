import * as VIM from '../../core-viewers/webgl/index'
import { DeferredPromise } from './deferredPromise'
import { LoadingError } from '../webgl/webglLoading'

type RequestCallbacks = {
  onProgress: (p: VIM.IProgressLogs) => void
  onError: (e: LoadingError) => void
  onDone: () => void
}

/**
 * Class to handle loading a request.
 */
export class LoadRequest {
  readonly source
  private _callbacks : RequestCallbacks
  private _request: VIM.VimRequest

  private _progress: VIM.IProgressLogs = { loaded: 0, total: 0, all: new Map() }
  private _progressPromise = new DeferredPromise<void>()

  private _isDone: boolean = false
  private _completionPromise = new DeferredPromise<void>()

  constructor (callbacks: RequestCallbacks, source: VIM.RequestSource, settings?: VIM.VimPartialSettings) {
    this.source = source
    this._callbacks = callbacks
    this.startRequest(source, settings)
  }

  private async startRequest (source: VIM.RequestSource, settings?: VIM.VimPartialSettings) {
    this._request = await VIM.request(source, settings)
    for await (const progress of this._request.getProgress()) {
      this.onProgress(progress)
    }
    const result = await this._request.getResult()
    if (result.isError()) {
      this.onError(result.error)
    } else {
      this.onSuccess()
    }
  }

  private onProgress (progress: VIM.IProgressLogs) {
    this._callbacks.onProgress(progress)
    this._progress = progress
    this._progressPromise.resolve()
    this._progressPromise = new DeferredPromise<void>()
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

  async * getProgress () : AsyncGenerator<VIM.IProgressLogs, void, void> {
    while (!this._isDone) {
      await this._progressPromise
      yield this._progress
    }
  }

  async getResult () {
    await this._completionPromise
    return this._request.getResult()
  }

  abort () {
    this._request.abort()
    this.onError('Request aborted')
  }
}
