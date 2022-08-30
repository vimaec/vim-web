import React, { useEffect, useRef } from 'react'
import { useState } from 'react'
import * as VIM from 'vim-webgl-viewer/'
import { getVisibleBoundingBox, SideContent } from './component'
import * as Icons from './icons'


// Shared Buttons style
const btnStyle = 'rounded-full text-black h-10 w-10 flex items-center justify-center transition-all hover:scale-110 hover:bg-hover-t40'
const toggleButton = (tip: string, action : () => void, icon: ({height,width,fill}) => JSX.Element, isOn : ()=> boolean) => {
  const fillColor = isOn() ? "blue" : "black"
  return <button data-tip={tip} onClick={action} className={btnStyle} type="button">{icon({height:"24", width:"24", fill:fillColor})}</button>
}

const actionButton = (tip: string, action : () => void, icon: ({height,width,fill}) => JSX.Element) => {
  return <button data-tip={tip} onClick={action} className={btnStyle} type="button">{icon({height:"24", width:"24", fill:"currentColor"})}</button>
}

// Main Control bar
export function ControlBar(
  props: {
    viewer: VIM.Viewer,
    helpVisible: boolean,
    setHelpVisible: (value:boolean) => void,
    sideContent: SideContent,
    setSideContent : (value: SideContent) => void
  }){

  return <div className='vim-menu flex items-center justify-center w-full fixed px-2 bottom-0 py-2 divide-x-2 bg-white'>
    <div className ='vim-menu-section flex items-center'>
      {TabCamera(props.viewer)}
    </div>
    <div className='divider'/>
    <div className='vim-menu-section flex items-center' >
      {TabTools(props.viewer)}
    </div>
    <div className='divider'/>
    <div className='vim-menu-section flex items-center'>
      {TabSettings(props)}
    </div>
  </div>
}

function TabCamera(viewer : VIM.Viewer){
  const [mode, setMode] = useState<VIM.PointerMode>(viewer.inputs.pointerMode)
  useEffect(() => {
    viewer.inputs.onPointerModeChanged = () => setMode(viewer.inputs.pointerMode)
  },[])

  const onModeBtn = (target: VIM.PointerMode) => {
    const next = mode === target ? viewer.inputs.altPointerMode : target
    viewer.inputs.pointerMode = next
    setMode(next)
  }

  const onFrameBtn = () => {
    const target = viewer.selection.count > 0
     ? viewer.selection
     : viewer.renderer

    viewer.camera.frame(getVisibleBoundingBox(viewer), 'none', viewer.camera.defaultLerpDuration)
  }

  //Camera
  const btnOrbit = toggleButton('Orbit', () => onModeBtn('orbit'), Icons.orbit, () => mode === 'orbit')
  const btnLook = toggleButton('Look Around', () => onModeBtn('look'), Icons.look, () => mode === 'look')
  const btnPan = toggleButton('Pan', () => onModeBtn('pan'), Icons.pan, () => mode === 'pan')
  const btnZoom = toggleButton('Zoom', () => onModeBtn('dolly'), Icons.zoom, () => mode === 'dolly')
  const btnFrameRect = toggleButton('Zoom Window', () => onModeBtn('zone'), Icons.frameRect, () => mode === 'zone')
  const btnFrame = actionButton('Zoom to Fit', onFrameBtn, Icons.frameSelection)
  const btnFullScreen = actionButton('Fullscreen', () => console.log('Full Screen'), Icons.fullsScreen)

  return <>
    <div className='mx-1'>{btnOrbit}</div>
    <div className='mx-1'>{btnLook}</div>
    <div className='mx-1'>{btnPan}</div>
    <div className='mx-1'>{btnZoom}</div>
    <div className='mx-1'>{btnFrameRect}</div>
    <div className='mx-1'>{btnFrame}</div>
    <div className='mx-1'>{btnFullScreen}</div>
  </>
}

function TabTools(viewer: VIM.Viewer){
  // Need a ref to get the up to date value in callback.
  const [measuring, setMeasuring] = useState(false)
  const [measurement, setMeasurement] = useState<VIM.THREE.Vector3>()
  const [section, setSection] = useState(false)
  const measuringRef = useRef<boolean>()
  measuringRef.current = measuring

  const onSectionBtn = () => {
    if(measuring){
      onMeasureBtn()
    }

    const next = !section
    viewer.gizmoSection.interactive = next
    viewer.gizmoSection.visible = next
    if(next){
      viewer.camera.frame(viewer.renderer.section.box, 'none', viewer.camera.defaultLerpDuration)
    }
    
    setSection(next)
  }

  const onMeasureBtn = () => {
    if(section){
      onSectionBtn()
    }

    if(measuring){
      viewer.gizmoMeasure.abort()
      setMeasuring(false)
    }
    else{
      setMeasuring(true)
      loopMeasure(viewer, () => measuringRef.current, (m) => setMeasurement(m))
    }
  }

  const onSectionDeleteBtn = () => {
    viewer.gizmoSection.fitBox(viewer.renderer.getBoundingBox())
    onSectionBtn()
  }



  const onSectionUndoBtn = () => {
    viewer.gizmoSection.fitBox(viewer.renderer.getBoundingBox())
  }

  const onMeasureDeleteBtn = () => {
    viewer.gizmoMeasure.abort()
    onMeasureBtn()
  }
  const onMeasureUndoBtn = () => {
    viewer.gizmoMeasure.abort()
  }

  const btnSection = actionButton('Sectioning Mode', onSectionBtn, Icons.sectionBox)
  const btnIsolation = actionButton('Toggle Isolation', () => console.log("Toggle Isolation"), Icons.sectionBox)
  const btnMeasure =  actionButton("Measuring Mode", onMeasureBtn, Icons.measure)
  const toolsTab = <>
    <div className='mx-1'>{btnSection}</div>
    <div className='mx-1'>{btnMeasure}</div>
  </> 

  const btnMeasureDelete = actionButton('Delete', onMeasureDeleteBtn, Icons.trash)
  const btnMeasureUndo = actionButton('Undo', onMeasureUndoBtn, Icons.undo)
  const btnMeasureConfirm = actionButton('Done', onMeasureBtn, Icons.checkmark)
  const measureTab = <>
    <div className='mx-1'>{btnMeasureDelete}</div>
    <div className='mx-1'>{btnMeasureUndo}</div>
    <div className='mx-1'>{btnMeasureConfirm}</div>
  </>

  const btnSectionDelete = actionButton('Delete', onSectionDeleteBtn, Icons.trash)
  const btnSectionUndo = actionButton('Undo', onSectionUndoBtn, Icons.undo)
  const btnSectionConfirm = actionButton('Done', onSectionBtn, Icons.checkmark)
  const sectionTab = <>
  <div className='mx-1'>{btnSectionDelete}</div>
  <div className='mx-1'>{btnSectionUndo}</div>
  <div className='mx-1'>{btnSectionConfirm}</div>
</>

  return measuring ? measureTab
  : section ? sectionTab
  : toolsTab
}

function TabSettings(
  props: {
    helpVisible: boolean,
    setHelpVisible: (value:boolean) => void
    sideContent: SideContent,
    setSideContent: (value: SideContent) => void
  }){
  const onHelpBtn = () => {
    props.setHelpVisible(!props.helpVisible)
  }

  const onTreeViewBtn = () => {
    props.setSideContent(props.sideContent === 'bim' ? 'none' : 'bim')
  }

  const onSettingsBtn = () => {
    props.setSideContent(props.sideContent === 'settings' ? 'none' : 'settings')
  }

  const btnTreeView = toggleButton("Project Inspector", onTreeViewBtn, Icons.treeView, ()=> props.sideContent === 'bim')
  const btnSettings = toggleButton("Settings", onSettingsBtn, Icons.settings,  ()=> props.sideContent === 'settings')
  const btnHelp = toggleButton("Help", onHelpBtn, Icons.help, () => props.helpVisible) 

  return <>
    <div className='mx-1'>{btnTreeView}</div>
    <div className='mx-1'>{btnSettings}</div>
    <div className='mx-1'>{btnHelp}</div>
  </>
}


/**
 * Behaviour to have measure gizmo loop over and over.  
 */
function loopMeasure(viewer: VIM.Viewer, getMeasuring:() => boolean, setMeasure: (value:VIM.THREE.Vector3) => void ) {
  
  const onMouseMove = () =>{
    setMeasure(viewer.gizmoMeasure.measurement)
  } 

  viewer.viewport.canvas.addEventListener('mousemove', onMouseMove)
  viewer.gizmoMeasure.measure()
  .then(() => {
    setMeasure(viewer.gizmoMeasure.measurement)
  })
  .catch(() => {
    setMeasure(undefined)
  })
  .finally(() => {
    viewer.viewport.canvas.removeEventListener('mousemove', onMouseMove)
    if(getMeasuring()) {
      loopMeasure(viewer, getMeasuring, setMeasure)
    }
  })
}