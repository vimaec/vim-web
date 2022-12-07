import React, { useEffect, useState } from 'react'
import * as VIM from 'vim-webgl-viewer/'
import { setComponentBehind } from './helpers/html'

type Progress = 'processing' | number | string

export const LoadingBox = React.memo(_LoadingBox)
function _LoadingBox (props: { viewer: VIM.Viewer; msg: string }) {
  const [progress, setProgress] = useState<Progress>()

  // Patch load
  useEffect(() => {
    const prevLoad = props.viewer.loadVim.bind(props.viewer)
    props.viewer.loadVim = function (
      source: string | ArrayBuffer,
      options: VIM.VimOptions,
      _: (logger: VIM.IProgressLogs) => void
    ): Promise<VIM.Vim> {
      return prevLoad(source, options, (p) => {
        setProgress(p.loaded)
      }).then((vim) => {
        setProgress(undefined)
        return vim
      })
    }

    // Clean up
    return () => {
      props.viewer.loadVim = props.viewer.loadVim.bind(props.viewer)
    }
  }, [])

  useEffect(() => {
    setComponentBehind(progress !== undefined)
  }, [progress])

  const msg = props.msg ?? formatProgress(progress)

  if (!msg) return null
  return (
    <div
      className="vim-loading-wrapper vc-fixed vc-top-0 vc-left-0 vc-z-40 vc-h-full vc-w-full vc-items-center vc-justify-center vc-bg-overflow vc-backdrop-blur"
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="vim-loading-box vc-absolute vc-top-[calc(50%-37px)] vc-left-[calc(50%-160px)] vc-z-20 vc-m-auto vc-w-[320px] vc-self-center vc-rounded vc-bg-white vc-px-5 vc-py-4 vc-shadow-lg">
        <h1 className="vim-loading-title vc-mb-2 vc-w-full vc-text-gray-medium">
          {' '}
          {msg}{' '}
        </h1>
        <span className="vim-loading-widget"></span>
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
