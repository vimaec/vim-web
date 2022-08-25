import { ContextMenu, MenuItem } from "@firefox-devtools/react-contextmenu"
import React, { useEffect, useState } from "react"
import * as VIM from 'vim-webgl-viewer/'
import { Settings } from "./component"

export const VIM_CONTEXT_MENU_ID = 'vim-context-menu-id'

export function VimContextMenu(props :{viewer: VIM.Viewer, settings: Settings }){
  const viewer = props.viewer

  const someHidden = () => {
    for(const vim of viewer.vims){
      for (const obj of vim.getAllObjects()) {
        if(!obj.visible){
          return true
        }
      }
    }
    return false
  }

  const [objects, setObject] = useState<VIM.Object[]>([])
  const [hidden, setHidden] = useState<boolean>(someHidden())
  const [section, setSection] = useState<boolean>(false)

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

  const onFrameBtn = () => {
    viewer.camera.frame(viewer.selection.getBoundingBox(), 'center', viewer.camera.defaultLerpDuration)
  }

  const onHideBtn = () => {
    if(objects.length ===0) return
    for (const obj of objects) {
      obj.visible = false

      obj.vim.scene.material = props.settings.useIsolationMaterial
      ? viewer.renderer.materials.isolation
      : undefined
    }
    viewer.selection.clear()
    setHidden(true)
  }
  
  const onIsolateBtn = () => {
    const set = new Set(objects)
    const vim = viewer.selection.vim
    for (const obj of vim.getAllObjects()) {
      obj.visible = set.has(obj)
      if(obj.visible) console.log(obj)
    }

    vim.scene.material = props.settings.useIsolationMaterial
      ? viewer.renderer.materials.isolation
      : undefined

    setHidden(true)
  }

  const onShowAllBtn = () => {
    viewer.vims.forEach((v) => {
      for (const obj of v.getAllObjects()) {
        obj.visible = true
      }
      v.scene.material = undefined
    })
    setHidden(false)
  }

  const onResetBtn = () => {
    viewer.camera.frame(viewer.renderer.getBoundingBox(), 45, viewer.camera.defaultLerpDuration)
  }

  const onResetSectionBtn = () => {
    viewer.gizmoSection.fitBox(viewer.renderer.getBoundingBox())
  }

  const onClearSelectionBtn = () => {
    viewer.selection.clear()
  }

  const onShowControls = () => {
    console.log('Show Controls')
  }

  const hasSelection = objects.length > 0

  return <div className='vim-context-menu'>
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
      { hidden ?
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