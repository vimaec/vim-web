import { ContextMenu, MenuItem } from "@firefox-devtools/react-contextmenu"
import React, { useEffect, useState } from "react"
import * as VIM from 'vim-webgl-viewer/'
import { Settings } from "./component"
import {getVisibleBoundingBox} from "./component"

export const VIM_CONTEXT_MENU_ID = 'vim-context-menu-id'
type ClickCallback = React.MouseEvent<HTMLDivElement, MouseEvent>

export function VimContextMenu(
  props :{
    viewer: VIM.Viewer,
    settings: Settings,
    helpVisible: boolean,
    setHelpVisible: (value: boolean) => void,
    resetIsolation: () => void
    hidden: boolean,
    setHidden: (value: boolean) => void 
  }){
  const viewer = props.viewer
  const [objects, setObject] = useState<VIM.Object[]>([])
  const [section, setSection] = useState<boolean>(false)
  console.log("VimContextMenu hidden: " + props.hidden)
  useEffect( () => {
    const old = viewer.selection.onValueChanged
    viewer.selection.onValueChanged = () => {
      old?.()
      setObject([...viewer.selection.objects])
      }
    
    viewer.gizmoSection.onBoxConfirm = () => {
      const clipping = !viewer.gizmoSection.box.containsBox(viewer.renderer.getBoundingBox())
      setSection(clipping)
    }
  }
  ,[])

  const onFrameBtn = (e: ClickCallback) => {
    viewer.camera.frame(getVisibleBoundingBox(viewer), 'none', viewer.camera.defaultLerpDuration)
    e.stopPropagation()
  }

  const onHideBtn = (e: ClickCallback) => {
    if(objects.length ===0) return
    props.resetIsolation()
    for (const obj of objects) {
      obj.visible = false
    }

    const vim = viewer.selection.vim
    vim.scene.material = props.settings.useIsolationMaterial
    ? viewer.renderer.materials.isolation
    : undefined

    props.viewer.environment.groundPlane.visible = false
    viewer.selection.clear()
    viewer.camera.frame(getVisibleBoundingBox(vim), 'none', viewer.camera.defaultLerpDuration)
    props.setHidden(true)
    e.stopPropagation()
  }
  
  const onIsolateBtn = (e: ClickCallback) => {
    if(objects.length === 0) return
    props.resetIsolation()
    const set = new Set(objects)
    const vim = viewer.selection.vim
    for (const obj of vim.getAllObjects()) {
      obj.visible = set.has(obj)
    }
    
    vim.scene.material = props.settings.useIsolationMaterial
      ? viewer.renderer.materials.isolation
      : undefined
    viewer.environment.groundPlane.visible = false
    viewer.camera.frame(getVisibleBoundingBox(vim), 'none', viewer.camera.defaultLerpDuration)
    props.setHidden(true)
    e.stopPropagation()
  }

  const onShowAllBtn = (e: ClickCallback) => {
    viewer.vims.forEach((v) => {
      for (const obj of v.getAllObjects()) {
        obj.visible = true
      }
      v.scene.material = undefined
    })
    viewer.environment.groundPlane.visible = props.settings.showGroundPlane
    viewer.camera.frame(viewer.renderer.getBoundingBox(), 'none', viewer.camera.defaultLerpDuration)
    props.setHidden(false)
    e.stopPropagation()
  }

  const onResetBtn = (e: ClickCallback) => {
    viewer.camera.frame(viewer.renderer.getBoundingBox(), 45, viewer.camera.defaultLerpDuration)
    e.stopPropagation()
  }

  const onResetSectionBtn = (e: ClickCallback) => {
    viewer.gizmoSection.fitBox(viewer.renderer.getBoundingBox())
    e.stopPropagation()
  }

  const onClearSelectionBtn = (e: ClickCallback) => {
    viewer.selection.clear()
    e.stopPropagation()
  }

  const onShowControls = ( e: ClickCallback) => {
    props.setHelpVisible(!props.helpVisible)
    e.stopPropagation()
  }

  const hasSelection = objects.length > 0

  return <div className='vim-context-menu' onContextMenu={(e) =>{
    console.log('No menu')
    e.preventDefault()
  }}>
    <ContextMenu id={VIM_CONTEXT_MENU_ID}>
      <MenuItem onClick={onShowControls} >
          Show Controls
      </MenuItem>
      <MenuItem divider />

      <MenuItem data={{foo: 'bar'}} onClick={onResetBtn} >
        Reset Camera
      </MenuItem>
      <MenuItem data={{foo: 'bar'}} onClick={onFrameBtn} >
        Zoom to Fit
      </MenuItem>
      
      {
        section ?
        <>
          <MenuItem divider />
          <MenuItem data={{foo: 'bar'}} onClick={onResetSectionBtn} >
            Reset Section Box
          </MenuItem>
        </>
        : null
      }


      {
        hasSelection ?
        <>
          <MenuItem divider />
          <MenuItem data={{foo: 'bar'}} onClick={onIsolateBtn} >
            Isolate Object
          </MenuItem>
          <MenuItem data={{foo: 'bar'}} onClick={onHideBtn}  >
            Hide Object
          </MenuItem>
          <MenuItem data={{foo: 'bar'}} onClick={onClearSelectionBtn} >
            Clear Selection
          </MenuItem>
          
        </>
      : null
      }
      { props.hidden ?
        <>
          <MenuItem divider />
          <MenuItem data={{foo: 'bar'}} onClick={onShowAllBtn} >
            Show All
          </MenuItem>
        </>
        : null
      }

    </ContextMenu>
  </div>
}

