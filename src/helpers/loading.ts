/**
 * @module viw-webgl-component
 */

import * as VIM from 'vim-webgl-viewer/'
import { SimpleEventDispatcher } from 'ste-simple-events'
import { SignalDispatcher } from 'ste-signals'

export type LoadSettings = VIM.VimPartialSettings &
{
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
    source: string | ArrayBuffer,
    settings: LoadSettings,
    onProgress?: (p: VIM.IProgressLogs) => void
  ) {
    let vim : VIM.Vim
    try {
      vim = await VIM.open(source, settings, (p) => {
        onProgress?.(p)
        this._onProgress.dispatch(p)
      })
    } catch (e) {
      console.log('Error loading vim', e)
      this._onError.dispatch(e.toString())
      return
    }

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
    this._onDone.dispatch()
    return vim
  }

  /**
   * Removes the vim from the viewer and disposes it.
   * @param vim Vim to remove from the viewer.
   */
  close (vim: VIM.Vim) {
    this._viewer.remove(vim)
    vim.dispose()
  }
}
