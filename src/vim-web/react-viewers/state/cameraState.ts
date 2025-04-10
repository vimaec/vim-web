/**
 * @module viw-webgl-react
 */

import { useEffect } from 'react'
import { SectionBoxRef, THREE } from '../../index'
import { ActionRef, AsyncFuncRef, StateRef, useActionRef, useAsyncFuncRef, useStateRef } from '../helpers/reactUtils'
import { ISignal } from 'ste-signals'

export interface CameraRef {
  autoCamera: StateRef<boolean>
  reset : ActionRef

  frameSelection: AsyncFuncRef<void>
  frameScene: AsyncFuncRef<void>

  // Allow to override these at the component level
  getSelectionBox: AsyncFuncRef<THREE.Box3 | undefined>
  getSceneBox: AsyncFuncRef<THREE.Box3 | undefined>
}

interface ICameraAdapter {
  onSelectionChanged: ISignal
  frameCamera: (box: THREE.Box3, duration: number) => void
  resetCamera: (duration : number) => void
  getSelectionBox: () => Promise<THREE.Box3 | undefined>
  getSceneBox: () => Promise<THREE.Box3 | undefined>
}

export function useCamera(adapter: ICameraAdapter, section: SectionBoxRef){

  const autoCamera = useStateRef(false)
  autoCamera.useOnChange((v) => {
    if (v) {frameSelection.call()}
  });

  useEffect(() => {
    const refresh = () => {
      if(autoCamera.get()){
        frameSelection.call()
      }
    }
    
    // Reframe on section box change.
    section.sectionSelection.append(refresh)
    section.sectionScene.append(refresh)
    adapter.onSelectionChanged.sub(refresh)
  },[])

  const reset = useActionRef(() => adapter.resetCamera(1))
  const getSelectionBox = useAsyncFuncRef(adapter.getSelectionBox)
  const getSceneBox = useAsyncFuncRef(adapter.getSceneBox)

  const frameSelection = useAsyncFuncRef(async () => {
    const box = (await getSelectionBox.call()) ?? (await getSceneBox.call())
    frame(adapter, section, box)
  })

  const frameScene = useAsyncFuncRef(async () => {
    const box = await getSceneBox.call()
    frame(adapter, section, box)
  })

  return {
    getSelectionBox,
    getSceneBox,
    autoCamera,
    reset,
    frameSelection,
    frameScene
  } as CameraRef
}

function frame(adapter: ICameraAdapter, section: SectionBoxRef, box: THREE.Box3) {
  if(!box) return

  // Take into account section box for framing.
  if(section.enable.get()){
    const sectionBox = section.getBox();
    if (section) {
      box.intersect(sectionBox);
    }

    if(box.isEmpty()){
      box.copy(sectionBox)
    }
  }
  adapter.frameCamera(box, 1)
}