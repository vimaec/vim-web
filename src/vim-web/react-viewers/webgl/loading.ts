/**
 * @module viw-webgl-react
 */

import { serverFileDownloadingError } from '../errors/errors'
import * as Core from '../../core-viewers'
import { LoadRequest } from '../helpers/loadRequest'
import { ModalApi } from '../panels/modal'
import { UltraSuggestion } from '../panels/loadingBox'
import { WebglSettings } from './settings'

type AddSettings = {
  /**
   * Controls whether to frame the camera on a vim everytime it is updated.
   * Default: true
   */
  autoFrame?: boolean
}

export type OpenSettings = Core.Webgl.VimPartialSettings & AddSettings

export type LoadingError = {
  url: string
  error: string
}

/**
 * Provides functionality for asynchronously opening sources and tracking progress.
 * Includes event emitters for progress updates and completion notifications.
 */
export class ComponentLoader {
  private _viewer : Core.Webgl.Viewer
  private _modal: React.RefObject<ModalApi>
  private _addLink : boolean = false

  constructor (
    viewer : Core.Webgl.Viewer,
    modal: React.RefObject<ModalApi>,
    settings: WebglSettings
  ) {
    this._viewer = viewer
    this._modal = modal
    // TODO: Enable this when we are ready to support it
    this._addLink = /* settings.capacity.canFollowUrl */false
  }

  /**
   * Event emitter for progress updates.
   */
  onProgress (p: Core.IProgress) {
    this._modal.current?.loading({
      message: 'Loading in WebGL Mode',
      progress: p.current,
      mode: p.type,
      more: this._addLink ? UltraSuggestion() : undefined
    })
  }

  /**
    * Event emitter for completion notifications.
   */
  onDone () {
    this._modal.current?.loading(undefined)
  }

  /**
   * Event emitter for error notifications.
   */
  onError (e: LoadingError) {
    this._modal.current?.message(serverFileDownloadingError(e.url))
  }

  /**
   * Opens a vim file without loading geometry.
   * Use this for querying BIM data or selective loading.
   * Call vim.load() or vim.load(subset) to load geometry later.
   * @param source The url to the vim file or a buffer of the file.
   * @param settings Settings to apply to vim file.
   * @returns A LoadRequest to track progress and get result. The vim is auto-added on success.
   * @throws Error if the viewer has reached maximum capacity (256 vims)
   */
  open (source: Core.Webgl.RequestSource, settings: OpenSettings = {}): Core.Webgl.IWebglLoadRequest {
    return this.loadInternal(source, settings, false)
  }

  /**
   * Loads a vim file with all geometry.
   * Use this for immediate viewing.
   * @param source The url to the vim file or a buffer of the file.
   * @param settings Settings to apply to vim file.
   * @returns A LoadRequest to track progress and get result. The vim is auto-added on success.
   * @throws Error if the viewer has reached maximum capacity (256 vims)
   */
  load (source: Core.Webgl.RequestSource, settings: OpenSettings = {}): Core.Webgl.IWebglLoadRequest {
    return this.loadInternal(source, settings, true)
  }

  private loadInternal (source: Core.Webgl.RequestSource, settings: OpenSettings, loadGeometry: boolean) {
    const request = this._viewer.load(source, settings)

    return new LoadRequest(
      {
        onProgress: (p) => this.onProgress(p),
        onError: (e) => this.onError(e),
        onDone: () => this.onDone()
      },
      request,
      source.url,
      (vim) => this.initVim(vim, settings, loadGeometry)
    )
  }

  private async initVim (vim: Core.Webgl.IWebglVim, settings: AddSettings, loadGeometry: boolean) {
    if (loadGeometry) {
      await vim.load()
      if (settings.autoFrame !== false) {
        this._viewer.camera.snap().frame(vim)
        this._viewer.camera.save()
      }
    }
  }
}
