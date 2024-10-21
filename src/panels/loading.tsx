/**
 * @module viw-webgl-component
 */

import React, { useEffect, useState } from 'react'
import { setComponentBehind } from '../helpers/html'
import * as Icons from './icons'
import { ComponentLoader } from '../helpers/loading'

type Progress = 'processing' | number | string

export type MsgInfo = { message?: string; info?: string, progress?: Progress}

/**
 * Memoized version of Loading Box
 */
export const LoadingBoxMemo = React.memo(LoadingBox)

/**
 * Loading box JSX Component that can also be used to show messages.
 */
function LoadingBox (props: { loader: ComponentLoader, content: MsgInfo }) {
  const [info, setInfo] = useState<MsgInfo>()

  // Patch load
  useEffect(() => {
    props.loader.onProgress.sub(p => setInfo({ progress: p.loaded }))
    props.loader.onError.sub((e) => setInfo({ progress: e }))
    props.loader.onDone.sub(() => setInfo(null))
  }, [])

  useEffect(() => {
    setComponentBehind(info !== undefined)
  }, [info])

  if (!info) return null
  return (
    <div
      className="vim-loading-container vc-absolute vc-inset-0 vc-z-40 vc-flex vc-items-center vc-justify-center vc-bg-overflow vc-backdrop-blur"
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="vim-loading-box vc-flex vc-box-content vc-gap-2 vc-flex-col vc-max-w-[320px] vc-max-h-[60px] vc-w-[72%] vc-h-[50%] vc-self-center vc-rounded vc-bg-white vc-px-5 vc-py-4 vc-shadow-lg">
        {content(info)}
        {gizmo(info)}
      </div>
    </div>
  )
}

function gizmo (info : MsgInfo) {
  if (typeof info.progress !== 'number') return null
  return <div className="vim-loading-widget"></div>
}

function content (info: MsgInfo) {
  const center = typeof info?.progress === 'number' ? '' : 'vc-text-center vc-my-auto'
  return <h1 className={`vim-loading-title  vc-w-full vc-text-gray-medium ${center}`}>
    {text(info)}
  </h1>
}

function text (info: MsgInfo | undefined) {
  if (info === undefined) return null
  if (info.progress === 'processing') {
    return 'Processing'
  }
  if (typeof info.progress === 'number') {
    return <div className="vc-flex vc-w-full vc-justify-between">
      <span>Loading...</span>
      <span>{Math.round(info.progress / 1000000)} MB</span>
    </div>
  }
  if (typeof info.progress === 'string') {
    return <>
      {'Error Loading Vim File'}
      {infoBtn(info.progress)}
    </>
  }
  return <>
    {info.message}
    {infoBtn(info.info)}
  </>
}

function infoBtn (message : string | undefined) {
  if (!message) return null
  return <span className='vc-ml-1' data-tip={message}>{
    Icons.help({
      height: '16',
      width: '16',
      fill: 'currentColor',
      className: 'vc-inline'
    })
  }
  </span>
}
