/**
 * @module viw-webgl-react
 */

import * as VIM from '../../core-viewers/webgl/index'
import { SideState } from '../sidePanel/sideState'
import { CameraRef } from '../state/cameraState'
import { Isolation } from '../helpers/isolation'

export function applyWebglBindings(
  viewer: VIM.Viewer,
  camera: CameraRef,
  isolation: Isolation,
  sideState: SideState)
  {
    const k = viewer.inputs.keyboard
    k.registerKeyUp("F4", 'replace', () => sideState.toggleContent('settings'))
    k.registerKeyUp("NumpadDivide", 'replace', () => sideState.toggleContent('settings'))
    k.registerKeyUp("KeyF", 'replace', () => camera.frameSelection.call())
    k.registerKeyUp("KeyI", 'replace', () => isolation.toggle('keyboard'))
    k.registerKeyUp("escape", 'replace', () => clearSelection(viewer, isolation))
    k.registerKeyUp("KeyV", 'replace', () => toggleVisibility(viewer.selection, isolation))
  }

  function toggleVisibility(selection: VIM.Selection, isolation: Isolation) {
    if (selection.count === 0) return
    const objs = [...selection.objects].filter((o) => o.type === 'Object3D')
    const visible = objs.some((o) => o.visible)
    if (visible) {
      isolation.hide(objs, 'keyboard')
      selection.clear()
    } else {
      isolation.show(objs, 'keyboard')
    }
  }

  function clearSelection(viewer: VIM.Viewer, isolation: Isolation) {
    if (viewer.selection.count > 0) {
      viewer.selection.clear()
    }
    if (isolation.isActive()) {
      isolation.clear('keyboard')
    }
  }

  