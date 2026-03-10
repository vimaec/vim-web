/**
 * @module viw-webgl-react
 */

import * as Core from '../../core-viewers'
import { SideState } from '../state/sideState'
import { FramingApi } from '../state/cameraState'
import { IsolationApi } from '../state/sharedIsolation'

export function applyWebglBindings(
  viewer: Core.Webgl.Viewer,
  framing: FramingApi,
  isolation: IsolationApi,
  sideState: SideState)
{
  const k = viewer.inputs.keyboard
  k.override("F4", 'up', () => sideState.toggleContent('settings'))
  k.override("NumpadDivide", 'up', () => sideState.toggleContent('settings'))
  k.override("KeyF", 'up', () => framing.frameSelection.call())
  k.override("KeyI", 'up', () =>{
    if(isolation.hasVisibleSelection() && isolation.visibility.get() !== 'onlySelection'){
      isolation.isolateSelection()
    }
    else{
      isolation.showAll()
    }
  })
  k.override("escape", 'up', () => viewer.selection.clear())
  k.override("KeyV", 'up', () => {
    if(isolation.hasVisibleSelection()){
      isolation.hideSelection()
    }
    else{
      isolation.showSelection()
    }
  })
}


  