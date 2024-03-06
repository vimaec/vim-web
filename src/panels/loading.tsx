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
   * Asynchronously opens a source, applying the provided settings.
   * @param source The source to open, either as a string or ArrayBuffer.
   * @param settings Partial settings to apply to the opened source.
   * @param onProgress Optional callback function to track progress during opening.
   * Receives progress logs as input.
   */
   async open (
    source: string | ArrayBuffer,
    settings: VIM.VimPartialSettings,
    onProgress?: (p: VIM.IProgressLogs) => void
  ){
    var vim = await VIM.open(source, settings, (p) => {
      onProgress?.(p)
      this._onProgress.dispatch(p)
    })
    this._viewer.add(vim)
    this._onDone.dispatch()
    return vim
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
