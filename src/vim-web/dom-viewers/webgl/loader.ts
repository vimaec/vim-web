import type * as Core from '../../core-viewers'
import { webglFileError } from '../errors'
import { LoadRequest } from '../helpers/loadRequest'
import { ultraSuggestion, type ModalApi } from '../modal'

type AddSettings = {
  /**
   * Controls whether to frame the camera on a vim every time it is updated.
   * Default: true
   */
  autoFrame?: boolean
  /**
   * Pre-caches BIM parameter table columns in the background after loading.
   * Eliminates the ~300ms delay on the first `getBimParameters()` call.
   * Default: false
   */
  prewarmBim?: boolean
}

export type OpenSettings = Core.Webgl.VimPartialSettings & AddSettings

export type LoadingError = {
  url: string
  error: string
}

/**
 * Loads vims with progress, completion and error reporting on the modal.
 */
export class WebglLoader {
  private readonly _viewer: Core.Webgl.Viewer
  private readonly _modal: ModalApi
  // TODO: enable when ready to support it (settings.capacity.canFollowUrl).
  private readonly _addLink = false

  constructor (viewer: Core.Webgl.Viewer, modal: ModalApi) {
    this._viewer = viewer
    this._modal = modal
  }

  /** Opens a vim without loading geometry; call `vim.load()` or `vim.load(subset)` later. */
  open (source: Core.Webgl.RequestSource, settings: OpenSettings = {}): Core.Webgl.IWebglLoadRequest {
    return this.loadInternal(source, settings, false)
  }

  /** Loads a vim with all its geometry. */
  load (source: Core.Webgl.RequestSource, settings: OpenSettings = {}): Core.Webgl.IWebglLoadRequest {
    return this.loadInternal(source, settings, true)
  }

  private loadInternal (source: Core.Webgl.RequestSource, settings: OpenSettings, loadGeometry: boolean) {
    const request = this._viewer.load(source, settings)
    return new LoadRequest(
      {
        onProgress: p => this._modal.loading({
          message: 'Loading in WebGL Mode',
          progress: p.current,
          mode: p.type,
          more: this._addLink ? ultraSuggestion() : undefined
        }),
        onError: e => this._modal.message(webglFileError(e.url, e.error)),
        onDone: () => this._modal.loading(undefined)
      },
      request,
      source.url,
      vim => this.initVim(vim, settings, loadGeometry)
    )
  }

  private async initVim (vim: Core.Webgl.IWebglVim, settings: OpenSettings, loadGeometry: boolean) {
    if (settings.prewarmBim) vim.prewarmBimCache()
    if (loadGeometry) {
      await vim.load()
      if (settings.autoFrame !== false) {
        this._viewer.camera.snap().frame(vim)
        this._viewer.camera.save()
      }
    }
  }
}
