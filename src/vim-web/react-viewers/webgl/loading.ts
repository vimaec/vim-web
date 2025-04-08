/**
 * @module viw-webgl-react
 */

import * as VIM from '../../core-viewers/webgl/index'
import { LoadRequest } from '../helpers/loadRequest'
import { ModalRef } from '../panels/modal'
import { Errors } from '..'

type AddSettings = {
  /**
   * Controls whether to frame the camera on a vim everytime it is updated.
   * Default: true
   */
  autoFrame?: boolean

  /**
   * Controls whether to initially load the vim content or not.
   * Default: false
   */
  loadEmpty?: boolean
}

export type OpenSettings = VIM.VimPartialSettings & AddSettings

export type LoadingError = {
  url: string
  error: string
}

/**
 * Provides functionality for asynchronously opening sources and tracking progress.
 * Includes event emitters for progress updates and completion notifications.
 */
export class ComponentLoader {
  private _viewer : VIM.WebglCoreViewer
  private _modal: ModalRef

  constructor (viewer : VIM.WebglCoreViewer, modal: ModalRef) {
    this._viewer = viewer
    this._modal = modal
  }

  /**
   * Event emitter for progress updates.
   */
  onProgress (p: VIM.IProgressLogs) {
    this._modal.loading({
      message: 'Loading in WebGL Mode',
      progress: p.loaded,
      mode: 'bytes'
    })
  }

  /**
     * Event emitter for completion notifications.
   */
  onDone () {
    this._modal.loading(undefined)
  }

  /**
   * Event emitter for error notifications.
   */
  onError (e: LoadingError) {
    this._modal.message(Errors.serverFileDownloadingError(e.url))
  }

  /**
   * Asynchronously opens a vim at source, applying the provided settings.
   * @param source The source to open, either as a string or ArrayBuffer.
   * @param settings Partial settings to apply to the opened source.
   * @param onProgress Optional callback function to track progress during opening.
   * Receives progress logs as input.
   */
  async open (
    source: VIM.RequestSource,
    settings: OpenSettings,
    onProgress?: (p: VIM.IProgressLogs) => void
  ) {
    const request = this.request(source, settings)

    for await (const progress of request.getProgress()) {
      onProgress?.(progress)
      this.onProgress(progress)
    }

    const result = await request.getResult()
    if (result.isError()) {
      console.log('Error loading vim', result.error)
      this.onError({
        url: source.url ?? '',
        error: result.error
      })
      return
    }
    const vim = result.result

    this.onDone()
    return vim
  }

  /**
   * Creates a new load request for the provided source and settings.
   * @param source The url to the vim file or a buffer of the file.
   * @param settings Settings to apply to vim file.
   * @returns A new load request instance to track progress and get result.
   */
  request (source: VIM.RequestSource,
    settings?: VIM.VimPartialSettings) {
    return new LoadRequest({
      onProgress: (p) => this.onProgress(p),
      onError: (e) => this.onError(e),
      onDone: () => this.onDone()
    }, source, settings)
  }

  /*
    * Adds a vim to the viewer and initializes it.
    * @param vim Vim to add to the viewer.
    * @param settings Optional settings to apply to the vim.
    */
  add (vim: VIM.WebglVim, settings: AddSettings = {}) {
    this.initVim(vim, settings)
  }

  /**
   * Removes the vim from the viewer and disposes it.
   * @param vim Vim to remove from the viewer.
   */
  remove (vim: VIM.WebglVim) {
    this._viewer.remove(vim)
    vim.dispose()
  }

  private initVim (vim : VIM.WebglVim, settings: AddSettings) {
    this._viewer.add(vim)
    vim.onLoadingUpdate.subscribe(() => {
      this._viewer.gizmos.loading.visible = vim.isLoading
      if (settings.autoFrame !== false && !vim.isLoading) {
        this._viewer.camera.snap().frame(vim)
        this._viewer.camera.save()
      }
    })
    if (settings.loadEmpty !== true) {
      void vim.loadAll()
    }
  }
}
