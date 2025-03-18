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
  hasSelection: () => boolean
  getSelectionBox: () => Promise<THREE.Box3>
  getSceneBox: () => Promise<THREE.Box3>
  getSectionBox: () => THREE.Box3
  isSectionBoxEnabled: () => boolean
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
    
    if (!adapter.hasSelection()){
      frameScene.call()
      return
    }

    frameBox(adapter, () => adapter.getSelectionBox())
  })

  const frameScene = useAsyncFuncRef(async () => {
    frameBox(adapter, () => adapter.getSceneBox())
  })

  return {
    autoCamera,
    reset,
    frameSelection,
    frameScene
  } as CameraRef
}

// Extracted common method to get the box, intersect with section (if available),
// and then frame the camera.
async function frameBox(adapter: ICameraAdapter, getBox: () => Promise<THREE.Box3 | null>): Promise<void> {
  const box = await getBox();
  if (!box) return;

  if(adapter.isSectionBoxEnabled()){
    const section = adapter.getSectionBox();
    if (section) {
      box.intersect(section);
    }

    if(box.isEmpty()){
      box.copy(section)
    }
  }

  adapter.frameCamera(box, 1);
}