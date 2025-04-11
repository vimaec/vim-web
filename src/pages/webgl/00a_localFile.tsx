import React, { ChangeEvent, useEffect, useRef } from 'react'
import * as VIM from '../../vim-web'

import Webgl = VIM.React.Webgl
import ViewerRef = VIM.React.Webgl.ViewerRef

export function WebglLocalFile () {
  const div = useRef<HTMLDivElement>(null)
  const cmp = useRef<ViewerRef>()
  const fileInput = useRef<HTMLInputElement>(null)
  useEffect(() => {
    createComponent(div.current, cmp)
    return () => cmp.current?.dispose()
  }, [])

  const delay = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  const handleOpen = (e: ChangeEvent<HTMLInputElement>) => {

    const file = e.target.files[0]
    if (!file)
      return

    // Hide the input file
    const fileInputElement = fileInput.current
    if (fileInputElement) fileInputElement.hidden = true

    // Read the file as an array buffer
    const reader = new FileReader()
    reader.onload = async (readerEvent) => {
      const content = readerEvent?.target?.result
      if (!content || !(content instanceof ArrayBuffer))
        return

      const vwgl = cmp.current
      vwgl.modal.loading({ progress: -1, mode: '%', message: 'Loading from Disk' })
      await delay(1000)

      try {
        const vim = await vwgl.loader.open({ buffer: content },{})
        vwgl.loader.add(vim)
      } finally {
        vwgl.modal.loading(undefined)
        vwgl.camera.frameScene.call()
      }
    }
    reader.readAsArrayBuffer(file)
  }

  return (
    <>
      <div ref={div} className='vc-inset-0 vc-absolute'/>
      <div className='navigation vc-fixed vc-top-10 vc-left-1/2 vc--translate-x-1/2 vc-z-50 vc-flex vc-flex-col vc-gap-1'>
        <input ref={fileInput} name='fileBrowserInput' type='file' onChange={handleOpen} accept=".vim"/>
      </div>
    </>
  )
}

async function createComponent (div: HTMLDivElement, ref: React.MutableRefObject<ViewerRef>) {
  const webgl = await Webgl.createViewer(div)
  ref.current = webgl
  globalThis.viewer = webgl
}
