/**
 * @module viw-webgl-react
 */

import * as Core from '../../core-viewers'
import { SideState } from '../state/sideState'
import { CameraApi } from '../state/cameraState'
import { IsolationApi } from '../state/sharedIsolation'

export function applyWebglBindings(
  viewer: Core.Webgl.Viewer,
  camera: CameraApi,
  isolation: IsolationApi,
  sideState: SideState)
{
  const k = viewer.inputs.keyboard
  k.override("F4", 'up', () => sideState.toggleContent('settings'))
  k.override("NumpadDivide", 'up', () => sideState.toggleContent('settings'))
  k.override("KeyF", 'up', () => camera.frameSelection.call())
  k.override("KeyI", 'up', () =>{
    if(isolation.adapter.current.hasVisibleSelection() && isolation.visibility.get() !== 'onlySelection'){
      isolation.adapter.current.isolateSelection()
    }
    else{
      isolation.adapter.current.showAll()
    }
  })
  k.override("escape", 'up', () => viewer.selection.clear())
  k.override("KeyV", 'up', () => {
    if(isolation.adapter.current.hasVisibleSelection()){
      isolation.adapter.current.hideSelection()
    }
    else{
      isolation.adapter.current.showSelection()
    }
  })
}


  