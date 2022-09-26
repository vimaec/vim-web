import React, { useEffect, useState } from 'react'
import * as VIM from 'vim-webgl-viewer/'
import { setBehind } from './utils/viewerUtils'

type Progress = 'processing' | number | string

export const LoadingBox = React.memo(_LoadingBox)
function _LoadingBox (props: { viewer: VIM.Viewer }) {
  const [progress, setProgress] = useState<Progress>()

  // Patch load
  useEffect(() => {
    const prevLoad = props.viewer.loadVim.bind(props.viewer)
    props.viewer.loadVim = function (
      source: string | ArrayBuffer,
      options: VIM.VimOptions.Root,
      _: (logger: VIM.IProgressLogs) => void
    ): Promise<VIM.Vim> {
      return prevLoad(source, options, (p) => {
        setProgress(p.loaded)
      }).then((_) => setProgress(undefined))
    }
  }, [])

  useEffect(() => {
    setBehind(progress !== undefined)
  }, [progress])

  const msg =
    progress === 'processing'
      ? 'Processing'
      : typeof progress === 'number'
        ? `Downloading: ${Math.round(progress / 1000000)} MB`
        : typeof progress === 'string'
          ? `Error: ${progress}`
          : undefined

  if (!msg) return null
  return (
    <div className="vim-loading-box">
      <h1> {msg} </h1>
    </div>
  )
}
