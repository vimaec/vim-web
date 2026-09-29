import * as Core from '../../core-viewers'
import { FramingApi } from '../api'
import { IsolationApi } from '../api'

export function applyWebglBindings(
  viewer: Core.Webgl.Viewer,
  framing: FramingApi,
  isolation: IsolationApi,
  /** F4 / numpad-divide: the viewer decides what "settings" means. */
  toggleSettings: () => void)
{
  const k = viewer.inputs.keyboard
  k.override("F4", 'up', toggleSettings)
  k.override("NumpadDivide", 'up', toggleSettings)
  k.override("KeyF", 'up', () => framing.frameSelection.call())
  k.override("KeyI", 'up', () =>{
    if(isolation.hasVisibleSelection() && isolation.visibility.get() === 'some'){
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


  