/**
 * @module viw-webgl-react
 */

import { useEffect, useRef } from 'react'
import { WebglViewer, THREE } from '../../index'
import { ActionRef, AsyncFuncRef, StateRef, useActionRef, useAsyncFuncRef, useFuncRef, useStateRef } from '../helpers/reactUtils'
import { ISignal } from 'ste-signals'

export interface CameraRef {
  autoCamera: StateRef<boolean>
  reset : ActionRef
  frameSelection: AsyncFuncRef<void>
  frameScene: AsyncFuncRef<void>
}

interface ICameraAdapter {
  onSelectionChanged: ISignal
  frameCamera: (box: THREE.Box3, duration: number) => void
  resetCamera: (duration : number) => void
  frameAll: (duration: number) => void
  hasSelection: () => boolean
  getSelectionBox: () => Promise<THREE.Box3>
}

export function useCamera(adapter: ICameraAdapter){
  const autoCamera = useStateRef(false)
  autoCamera.useOnChange((v) => {
    if (v) {frameSelection.call()}
  });

  useEffect(() => {
    adapter.onSelectionChanged.sub(() => {
      if (autoCamera.get()) {
        frameSelection.call()
      }
    })
  },[])

  const reset = useActionRef(() => adapter.resetCamera(1))

  const frameSelection = useAsyncFuncRef(async () => {
    console.log('frameSelection')
    if (!adapter.hasSelection()){
      frameScene.call()
      return
    }

    const box = await adapter.getSelectionBox()
    if(!box){
      return
    }

    adapter.frameCamera(box, 1)
  })

  const frameScene = useAsyncFuncRef(async () => {
    adapter.frameAll(1)
  })

  return {
    autoCamera,
    reset,
    frameSelection,
    frameScene
  } as CameraRef
}


/**
 * Returns the bounding box of all visible objects.
 * @param source Optional VIM to specify the source of visible objects.
 * @returns The bounding box of all visible objects.
 */
function getVisibleBoundingBox (viewer: WebglViewer.Viewer, source?: WebglViewer.Vim) {
  let box: THREE.Box3

  const vimBoxUnion = (vim: WebglViewer.Vim) => {
    for (const obj of vim.getObjects()) {
      if (!obj.visible) continue
      const b = obj.getBoundingBox()
      if (!b) continue
      box = box ? box.union(b) : b?.clone()
    }
  }
  if (source) {
    vimBoxUnion(source)
  } else {
    for (const vim of viewer.vims) {
      vimBoxUnion(vim)
    }
  }

  return box
}