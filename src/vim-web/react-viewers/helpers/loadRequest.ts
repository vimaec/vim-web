import * as Core from '../../core-viewers'
import { LoadRequest as CoreLoadRequest, ILoadRequest as CoreILoadRequest } from '../../core-viewers/webgl/loader/progressive/loadRequest'
import { IProgress } from '../../core-viewers/shared/loadResult'
import { AsyncQueue } from '../../utils/asyncQueue'
import { LoadingError } from '../webgl/loading'

type RequestCallbacks = {
  onProgress: (p: IProgress) => void
  onError: (e: LoadingError) => void
  onDone: () => void
}

/**
 * Class to handle loading a request.
 * Implements ILoadRequest for compatibility with Ultra viewer's load request interface.
 */
export class LoadRequest implements CoreILoadRequest {
  private _source: Core.Webgl.RequestSource
  private _request: Core.Webgl.LoadRequest
  private _callbacks: RequestCallbacks
  private _onLoaded?: (vim: Core.Webgl.Vim) => void
  private _progressQueue = new AsyncQueue<IProgress>()

  constructor (
    callbacks: RequestCallbacks,
    source: Core.Webgl.RequestSource,
    settings: Core.Webgl.VimPartialSettings,
    vimIndex: number,
    onLoaded?: (vim: Core.Webgl.Vim) => void
  ) {
    this._source = source
    this._callbacks = callbacks
    this._onLoaded = onLoaded
    this._request = new CoreLoadRequest(source, settings, vimIndex)
    this.trackRequest()
  }

  private async trackRequest () {
    try {
      for await (const progress of this._request.getProgress()) {
        this._callbacks.onProgress(progress)
        this._progressQueue.push(progress)
      }

      const result = await this._request.getResult()
      if (result.isSuccess === false) {
        this._callbacks.onError({ url: this._source.url, error: result.error })
      } else {
        this._onLoaded?.(result.vim)
        this._callbacks.onDone()
      }
    } catch (err) {
      this._callbacks.onError({ url: this._source.url, error: String(err) })
    }
    this._progressQueue.close()
  }

  get isCompleted () {
    return this._request.isCompleted
  }

  async * getProgress (): AsyncGenerator<IProgress> {
    yield * this._progressQueue
  }

  getResult () {
    return this._request.getResult()
  }

  abort () {
    this._request.abort()
  }
}
