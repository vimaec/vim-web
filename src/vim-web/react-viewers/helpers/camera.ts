/**
 * @module viw-webgl-react
 */

import { useEffect, useRef } from 'react'
import { WebglViewer, THREE } from '../../index'
import { ActionRef, StateRef, useActionRef, useStateRef } from './reactUtils'

export interface CameraRef {
  autoCamera: StateRef<boolean>
  reset :ActionRef
  frameSelection: ActionRef
  frameVisibleObjects: ActionRef
}

export function useCamera(viewer: WebglViewer.Viewer){
  const autoCamera = useStateRef(false)
  autoCamera.useOnChange((v) => {
    if (v) {frameSelection.call()}
  });

  useEffect(() => {
    viewer.selection.onValueChanged.sub(() => {
      if (autoCamera.get()) {
        frameSelection.call()
      }
    })
  },[])

  const reset = useActionRef(() => viewer.camera.lerp(1).reset())

  const frameSelection = useActionRef(() => {
    if (viewer.selection.count === 0){
      frameVisibleObjects.call()
      return
    }

    const box = viewer.selection.getBoundingBox()
    if(!box){
      return
    }

    box.intersect(viewer.gizmos.sectionBox.box)
    if(box.isEmpty()) {
      return
    }
        
    viewer.camera.lerp(1).frame(box)
  })
  const frameVisibleObjects = useActionRef(() => {
    const movement = viewer.camera.lerp(1)

    const box = getVisibleBoundingBox(viewer)
    movement.frame(box)
  })

  return {
    autoCamera,
    reset,
    frameSelection,
    frameVisibleObjects
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