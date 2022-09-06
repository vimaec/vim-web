import { ContextMenu, MenuItem } from "@firefox-devtools/react-contextmenu"
import React, { useEffect, useState } from "react"
import * as VIM from 'vim-webgl-viewer/'
import { frameContext, hideSelection, isolateSelection, Settings, showAll } from "./component"

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

  useEffect( () => {
    // Register to selection
    const old = viewer.selection.onValueChanged
    viewer.selection.onValueChanged = () => {
      old?.()
      setObject([...viewer.selection.objects])
      }
    
    // Register to section box
    viewer.gizmoSection.onBoxConfirm = () => {
      const clipping = !viewer.gizmoSection.box.containsBox(viewer.renderer.getBoundingBox())
      setSection(clipping)
    }
  }
  ,[])

  const onShowControlsBtn = ( e: ClickCallback) => {
    props.setHelpVisible(!props.helpVisible)
    e.stopPropagation()
  }

  const onCameraResetBtn = (e: ClickCallback) => {
    viewer.camera.frame(viewer.renderer.getBoundingBox(), 45, viewer.camera.defaultLerpDuration)
    e.stopPropagation()
  }

  const onCameraFrameBtn = (e: ClickCallback) => {
    frameContext(viewer)
    e.stopPropagation()
  }
  
  const onSelectionIsolateBtn = (e: ClickCallback) => {
    if(objects.length === 0) return
    props.resetIsolation()
    isolateSelection(viewer, props.settings)
    props.setHidden(true)
    e.stopPropagation()
  }

  const onSelectionHideBtn = (e: ClickCallback) => {
    if(objects.length ===0) return
    props.resetIsolation()
    hideSelection(viewer, props.settings)
    props.setHidden(true)
    e.stopPropagation()
  }

  const onSelectionClearBtn = (e: ClickCallback) => {
    viewer.selection.clear()
    e.stopPropagation()
  }

  const onShowAllBtn = (e: ClickCallback) => {
    showAll(viewer, props.settings)
    props.setHidden(false)
    e.stopPropagation()
  }

  const onSectionIgnoreBtn = ( e: ClickCallback) => {
    viewer.gizmoMeasure.abort()
  }

  const onSectionResetBtn = (e: ClickCallback) => {
    viewer.gizmoSection.fitBox(viewer.renderer.getBoundingBox())
    e.stopPropagation()
  }

  const onMeasureDeleteBtn = ( e: ClickCallback) => {
    viewer.gizmoMeasure.abort()
  }

  const createButton = (label: string, action:(e:ClickCallback) => void, condition: boolean = true) =>{
    if(!condition) return null
    return <MenuItem onClick={action} >
      {label}
    </MenuItem>
  }
  const createDivider = (condition : boolean = true)=>{
    return condition ? <MenuItem divider /> : null
  }
  
  const hasSelection = objects?.length > 0
  const measuring = viewer.gizmoMeasure.startPoint?.length() > 0

  return <div className='vim-context-menu' onContextMenu={(e) =>{
    console.log('No menu')
    e.preventDefault()
  }}>
    <ContextMenu id={VIM_CONTEXT_MENU_ID}>

      {createButton('Show Controls', onShowControlsBtn)}
      
      {/*Camera*/}
      {createDivider()}
      {createButton('Reset Camera', onCameraResetBtn)}
      {createButton('Zoom to Fit', onCameraFrameBtn, hasSelection)}
      
      {/*Selection*/}
      {createDivider(hasSelection || props.hidden)}
      {createButton('Isolate Object', onSelectionIsolateBtn, hasSelection)}
      {createButton('Hide Object', onSelectionHideBtn, hasSelection)}
      {createButton('Clear Selection', onSelectionClearBtn, hasSelection)}
      {createButton('Show All', onShowAllBtn,props.hidden)}

      {/*Measure*/}     
      {createDivider(measuring)} 
      {createButton('Delete Measurement', onMeasureDeleteBtn, measuring)}

      {/*Section*/}
      {createDivider(section)} 
      {createButton('Ignore Section Box', onSectionIgnoreBtn, section)}
      {createButton('Reset Section Box', onSectionResetBtn, section)}
      
    </ContextMenu>
  </div>
}

