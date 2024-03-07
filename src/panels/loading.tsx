/**
 * @module viw-webgl-component
 */

import React, { useEffect, useState } from 'react'
import * as VIM from 'vim-webgl-viewer/'
import { setComponentBehind } from '../helpers/html'
import * as Icons from './icons'
import { SimpleEventDispatcher } from 'ste-simple-events'
import { SignalDispatcher } from 'ste-signals'

type Progress = 'processing' | number | string

export type MsgInfo = { message: string; info: string }

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
 * Memoized version of Loading Box
 */
export const LoadingBoxMemo = React.memo(LoadingBox)

/**
 * Provides functionality for asynchronously opening sources and tracking progress.
 * Includes event emitters for progress updates and completion notifications.
 */
export class ComponentLoader {
  private _viewer : VIM.Viewer

  constructor(viewer : VIM.Viewer){
    this._viewer = viewer
  }

  /**
   * Event emitter for progress updates.
   */
  get onProgress (){
    return this._onProgress.asEvent()
  }
  private _onProgress = new SimpleEventDispatcher<VIM.IProgressLogs>()

  /**
   * Event emitter for completion notifications.
   */
  get onDone (){
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
  ){
    var vim = await VIM.open(source, settings, (p) => {
      onProgress?.(p)
      this._onProgress.dispatch(p)
    })
    this._viewer.add(vim)
    vim.onLoadingUpdate.subscribe(() => {
      this._viewer.gizmos.loading.visible = vim.isLoading
      if(settings.autoFrame != false &&!vim.isLoading){
        this._viewer.camera.snap().frame(vim)
        this._viewer.camera.save()
      }
    })
    if(settings.loadEmpty !== true){
      vim.loadAll()
    }
      
    this._onDone.dispatch()
    return vim
  }
  
  /**
   * Removes the vim from the viewer and disposes it.
   * @param vim Vim to remove from the viewer.
   */
  close(vim: VIM.Vim){
    this._viewer.remove(vim)
    vim.dispose()
  }
}



/**
 * Loading box JSX Component tha can also be used to show messages.
 */
function LoadingBox (props: { loader: ComponentLoader, content: MsgInfo }) {
  const [progress, setProgress] = useState<Progress>()

  // Patch load
  useEffect(() => {
    props.loader.onProgress.sub(p => setProgress(p.loaded))
    props.loader.onDone.sub(() => setProgress(null))
  }, [])

  useEffect(() => {
    setComponentBehind(progress !== undefined)
  }, [progress])

  const msg = props.content?.message ?? formatProgress(progress)

  if (!msg) return null
  return (
    <div
      className="vim-loading-wrapper vc-absolute vc-top-0 vc-left-0 vc-z-40 vc-h-full vc-w-full vc-items-center vc-justify-center vc-bg-overflow vc-backdrop-blur"
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="vim-loading-box vc-absolute vc-top-[calc(50%-37px)] vc-left-[calc(50%-160px)] vc-m-auto vc-w-[320px] vc-self-center vc-rounded vc-bg-white vc-px-5 vc-py-4 vc-shadow-lg">
        <h1
          className={`vim-loading-title  vc-w-full vc-text-gray-medium ${
            props.content?.info ? 'vc-text-center' : 'vc-mb-2'
          }`}
        >
          {' '}
          {msg}{' '}
          <span data-tip={props.content?.info}>
            {props.content?.info
              ? Icons.help({
                height: '16',
                width: '16',
                fill: 'currentColor',
                className: 'vc-inline'
              })
              : null}{' '}
          </span>
        </h1>

        {props.content?.message
          ? null
          : (
          <span className="vim-loading-widget"></span>
            )}
      </div>
    </div>
  )
}

function formatProgress (progress: Progress) {
  return progress === 'processing'
    ? (
        'Processing'
      )
    : typeof progress === 'number'
      ? (
    <div className="vc-flex vc-w-full vc-justify-between">
      <span>Loading...</span>
      <span>{Math.round(progress / 1000000)} MB</span>
    </div>
        )
      : typeof progress === 'string'
        ? (
    `Error: ${progress}`
          )
        : undefined
}
