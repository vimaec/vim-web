import * as Core from '../../core-viewers'
import { AsyncQueue } from '../../utils/asyncQueue'
import { LoadingError } from '../webgl/loading'

type RequestCallbacks = {
  onProgress: (p: Core.IProgress) => void
  onError: (e: LoadingError) => void
  onDone: () => void
}

/**
 * Class to handle loading a request.
 * Implements ILoadRequest for compatibility with Ultra viewer's load request interface.
 */
export class LoadRequest implements Core.Webgl.ILoadRequest {
  private _source: Core.Webgl.RequestSource
  private _request: Core.Webgl.LoadRequest
  private _callbacks: RequestCallbacks
  private _onLoaded?: (vim: Core.Webgl.Vim) => Promise<void> | void
  private _progressQueue = new AsyncQueue<Core.IProgress>()
  private _resultPromise: Promise<Core.LoadResult<Core.Webgl.Vim>>

  constructor (
    callbacks: RequestCallbacks,
    source: Core.Webgl.RequestSource,
    settings: Core.Webgl.VimPartialSettings,
    vimIndex: number,
    onLoaded?: (vim: Core.Webgl.Vim) => Promise<void> | void
  ) {
    this._source = source
    this._callbacks = callbacks
    this._onLoaded = onLoaded
    this._request = new Core.Webgl.LoadRequest(source, settings, vimIndex)
    this._resultPromise = this.trackAndGetResult()
  }

  private async trackAndGetResult (): Promise<Core.LoadResult<Core.Webgl.Vim>> {
    try {
      for await (const progress of this._request.getProgress()) {
        this._callbacks.onProgress(progress)
        this._progressQueue.push(progress)
      }

      const result = await this._request.getResult()
      if (result.isSuccess === false) {
        this._callbacks.onError({ url: this._source.url, error: result.error })
      } else {
        await this._onLoaded?.(result.vim)
        this._callbacks.onDone()
      }
      this._progressQueue.close()
      return result
    } catch (err) {
      this._callbacks.onError({ url: this._source.url, error: String(err) })
      this._progressQueue.close()
      throw err
    }
  }

  get isCompleted () {
    return this._request.isCompleted
  }

  async * getProgress (): AsyncGenerator<Core.IProgress> {
    yield * this._progressQueue
  }

  getResult () {
    return this._resultPromise
  }

  async getVim () {
    const result = await this.getResult()
    if (result.isSuccess === false) throw new Error(result.error)
    return result.vim
  }

  abort () {
    this._request.abort()
  }
}
