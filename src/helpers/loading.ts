/**
 * @module viw-webgl-component
 */

import * as VIM from 'vim-webgl-viewer/'
import { SimpleEventDispatcher } from 'ste-simple-events'
import { SignalDispatcher } from 'ste-signals'
import { LoadRequest } from './loadRequest'

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

/**
 * Provides functionality for asynchronously opening sources and tracking progress.
 * Includes event emitters for progress updates and completion notifications.
 */
export class ComponentLoader {
  private _viewer : VIM.Viewer

  constructor (viewer : VIM.Viewer) {
    this._viewer = viewer
  }

  /**
   * Event emitter for progress updates.
   */
  get onProgress () {
    return this._onProgress.asEvent()
  }

  private _onProgress = new SimpleEventDispatcher<VIM.IProgressLogs>()

  /**
   * Event emitter for error notifications.
   */
  private _onError = new SimpleEventDispatcher<string>()
  get onError () {
    return this._onError.asEvent()
  }

  /**
   * Event emitter for completion notifications.
   */
  get onDone () {
    return this._onDone.asEvent()
  }

  private _onDone = new SignalDispatcher()

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
    const request = await VIM.request(source, settings)

    for await (const progress of request.getProgress()) {
      onProgress?.(progress)
      this._onProgress.dispatch(progress)
    }

    const result = await request.getResult()
    if (result.isError()) {
      console.log('Error loading vim', result.error)
      this._onError.dispatch(result.error)
      return
    }
    const vim = result.result

    this._onDone.dispatch()
    return vim
  }

  /**
   * Creates a new load request for the provided source and settings.
   * @param source The url to the vim file or a buffer of the file.
   * @param settings Settings to apply to vim file.
   * @returns A new load request instance to track progress and get result.
   */
  request (source: VIM.RequestSource,
    settings: VIM.VimPartialSettings) {
    return new LoadRequest({
      onProgress: (p) => this._onProgress.dispatch(p),
      onError: (e) => this._onError.dispatch(e),
      onDone: () => this._onDone.dispatch()
    }, source, settings)
  }

  /*
    * Adds a vim to the viewer and initializes it.
    * @param vim Vim to add to the viewer.
    * @param settings Optional settings to apply to the vim.
    */
  add (vim: VIM.Vim, settings: AddSettings = {}) {
    this.initVim(vim, settings)
  }

  /**
   * Removes the vim from the viewer and disposes it.
   * @param vim Vim to remove from the viewer.
   */
  remove (vim: VIM.Vim) {
    this._viewer.remove(vim)
    vim.dispose()
  }

  private initVim (vim : VIM.Vim, settings: AddSettings) {
    this._viewer.add(vim)
    vim.onLoadingUpdate.subscribe(() => {
      this._viewer.gizmos.loading.visible = vim.isLoading
      if (settings.autoFrame !== false && !vim.isLoading) {
        this._viewer.camera.snap().frame(vim)
        this._viewer.camera.save()
      }
    })
    if (settings.loadEmpty !== true) {
      vim.loadAll()
    }
  }
}
