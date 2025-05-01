/**
 * @module viw-webgl-react
 */

import * as Core from '../../core-viewers'
import { SideState } from '../state/sideState'
import { CameraRef } from '../state/cameraState'
import { IsolationRef } from '../state/sharedIsolation'

export function applyWebglBindings(
  viewer: Core.Webgl.Viewer,
  camera: CameraRef,
  isolation: IsolationRef,
  sideState: SideState)
{
  const k = viewer.inputs.keyboard
  k.registerKeyUp("F4", 'replace', () => sideState.toggleContent('settings'))
  k.registerKeyUp("NumpadDivide", 'replace', () => sideState.toggleContent('settings'))
  k.registerKeyUp("KeyF", 'replace', () => camera.frameSelection.call())
  k.registerKeyUp("KeyI", 'replace', () =>{
    if(isolation.adapter.current.hasVisibleSelection() && isolation.visibility.get() !== 'onlySelection'){
      isolation.adapter.current.isolateSelection()
    }
    else{
      isolation.adapter.current.showAll()
    }
  })
  k.registerKeyUp("escape", 'replace', () => viewer.selection.clear())
  k.registerKeyUp("KeyV", 'replace', () => {
    if(isolation.adapter.current.hasVisibleSelection()){
      isolation.adapter.current.hideSelection()
    }
    else{
      isolation.adapter.current.showSelection()
    }
  })
}


  