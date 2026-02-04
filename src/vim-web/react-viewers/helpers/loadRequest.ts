import * as Core from '../../core-viewers'
import { LoadingError } from '../webgl/loading'

type RequestCallbacks = {
  onProgress: (p: Core.Webgl.IProgressLogs) => void
  onError: (e: LoadingError) => void
  onDone: () => void
}

/**
 * Class to handle loading a request.
 */
export class LoadRequest {
  readonly source: Core.Webgl.RequestSource
  private _request: Core.Webgl.VimRequest
  private _callbacks: RequestCallbacks
  private _onLoaded?: (vim: Core.Webgl.Vim) => void

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
    this._request = Core.Webgl.request(source, settings, vimIndex)
    this.trackRequest()
  }

  private async trackRequest () {
    try {
      for await (const progress of this._request.getProgress()) {
        this._callbacks.onProgress(progress)
      }

      const result = await this._request.getResult()
      if (result.isSuccess === false) {
        this._callbacks.onError({ url: this.source.url, error: result.error })
      } else {
        this._onLoaded?.(result.vim)
        this._callbacks.onDone()
      }
    } catch (err) {
      this._callbacks.onError({ url: this.source.url, error: String(err) })
    }
  }

  getProgress () {
    return this._request.getProgress()
  }

  getResult () {
    return this._request.getResult()
  }

  abort () {
    this._request.abort()
  }
}
