/**
 * @module viw-webgl-react
 */

import { useEffect } from 'react'
import * as THREE from 'three'
import { SectionBoxApi } from './sectionBoxState'
import { FuncRef, StateRef, useFuncRef, useStateRef } from '../helpers/reactUtils'
import type { ISignal } from '../../core-viewers/shared/events'

/**
 * High-level framing controls for the React viewer.
 * Provides semantic operations like "frame selection" and "frame scene".
 *
 * For low-level camera movement (orbit, pan, zoom, snap/lerp), use
 * `viewer.core.camera` which exposes {@link IWebglCamera}.
 *
 * @example
 * // Frame the current selection with animation
 * viewer.framing.frameSelection.call()
 *
 * // For direct camera manipulation, use the core camera:
 * viewer.core.camera.lerp(1).frame('all')
 * viewer.core.camera.snap().set(position, target)
 */
export interface FramingApi {
  /** When true, automatically frames the camera on the selection whenever it changes. */
  autoCamera: StateRef<boolean>
  /** Resets the camera to its last saved position. */
  reset: FuncRef<void, void>
  /** Frames the camera on the current selection (or scene if nothing selected). */
  frameSelection: FuncRef<void, Promise<void>>
  /** Frames the camera to show all loaded geometry. */
  frameScene: FuncRef<void, Promise<void>>
  /** Returns the bounding box of the current selection, or undefined if nothing selected. */
  getSelectionBox: FuncRef<void, Promise<THREE.Box3 | undefined>>
  /** Returns the bounding box of all loaded geometry. */
  getSceneBox: FuncRef<void, Promise<THREE.Box3 | undefined>>
}

interface ICameraAdapter {
  onSelectionChanged: ISignal
  frameCamera: (box: THREE.Box3, duration: number) => void
  resetCamera: (duration : number) => void
  getSelectionBox: () => Promise<THREE.Box3 | undefined>
  getSceneBox: () => Promise<THREE.Box3 | undefined>
}

export function useFraming(adapter: ICameraAdapter, section: SectionBoxApi){

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
    section.sectionSelection.update(prev => async () => { await prev(); refresh() })
    section.sectionScene.update(prev => async () => { await prev(); refresh() })
    adapter.onSelectionChanged.sub(refresh)
  },[])

  const reset = useFuncRef(() => adapter.resetCamera(1))
  const getSelectionBox = useFuncRef(adapter.getSelectionBox)
  const getSceneBox = useFuncRef(adapter.getSceneBox)

  const frameSelection = useFuncRef(async () => {
    const box = (await getSelectionBox.call()) ?? (await getSceneBox.call())
    frame(adapter, section, box)
  })

  const frameScene = useFuncRef(async () => {
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
  } as FramingApi
}

function frame(adapter: ICameraAdapter, section: SectionBoxApi, box: THREE.Box3) {
  if(!box) return

  // Take into account section box for framing.
  if(section.active.get()){
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