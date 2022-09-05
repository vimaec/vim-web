import React, { useEffect, useRef } from 'react'
import { useState } from 'react'
import ReactTooltip from 'react-tooltip'
import * as VIM from 'vim-webgl-viewer/'
import { getVisibleBoundingBox, SideContent } from './component'
import * as Icons from './icons'


// Shared Buttons style
const btnStyle = 'rounded-full text-gray-medium h-10 w-10 flex items-center justify-center transition-all hover:scale-110 hover:text-primary-royal'
const btnStyleActive = 'rounded-full text-white h-10 w-10 flex items-center justify-center transition-all hover:scale-110 opacity-60 hover:opacity-100'
const toggleButton = (tip: string, action : () => void, icon: ({height,width,fill}) => JSX.Element, isOn : ()=> boolean) => {
  const fillColor = isOn() ? "rounded-full text-gray-medium h-10 w-10 flex items-center justify-center transition-all hover:scale-110 hover:text-primary-royal text-primary" : "rounded-full text-gray-medium h-10 w-10 flex items-center justify-center transition-all hover:scale-110 hover:text-primary-royal text-gray-medium"
  return <button data-tip={tip} onClick={action} className={ fillColor} type="button">{icon({height:"20", width:"20", fill:'currentColor'})}</button>
}

const actionButton = (tip: string, action : () => void, icon: ({height,width,fill}) => JSX.Element, state: boolean) => {
  return <button data-tip={tip} onClick={action} className={state ? btnStyleActive : btnStyle} type="button">{icon({height:"20", width:"20", fill:"currentColor"})}</button>
}

// Main Control bar
export function ControlBar(
  props: {
    viewer: VIM.Viewer,
    helpVisible: boolean,
    setHelpVisible: (value:boolean) => void,
    sideContent: SideContent,
    setSideContent : (value: SideContent) => void,
    toggleIsolation: () => void
  }){

  useEffect(() => {
    ReactTooltip.rebuild()
  })
  
  return <div className='vim-menu flex items-center justify-center w-full fixed px-2 bottom-0 py-2 mb-9'>
    <div className ='vim-menu-section flex items-center bg-white rounded-full px-2 shadow-md'>
      {TabCamera(props.viewer)}
    </div>
    <>
      {TabTools(props.viewer, props.toggleIsolation)}
    </>
    <div className='vim-menu-section flex items-center bg-white rounded-full px-2 shadow-md'>
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
  const btnFrame = actionButton('Zoom to Fit', onFrameBtn, Icons.frameSelection, false)
  const btnFullScreen = actionButton('Fullscreen', () => console.log('Full Screen'), Icons.fullsScreen, false)

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

/* TAB TOOLS */
function TabTools(viewer: VIM.Viewer, toggleIsolation: () => void){
  // Need a ref to get the up to date value in callback.
  const [measuring, setMeasuring] = useState(false)
  const [measurement, setMeasurement] = useState<VIM.THREE.Vector3>()
  const [section, setSection] = useState(false)
  const [clip, setClip] = useState(viewer.gizmoSection.clip)
  
  const measuringRef = useRef<boolean>()
  measuringRef.current = measuring

  const onSectionBtn = () => {
    ReactTooltip.hide()
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
    ReactTooltip.hide()
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

  const onResetSectionBtn = () => {
    viewer.gizmoSection.fitBox(viewer.renderer.getBoundingBox())
  }

  const onSectionClip = () => {
    viewer.gizmoSection.clip = true
    setClip(true)
  }
  const onSectionNoClip = () => {
    viewer.gizmoSection.clip = false
    setClip(false)
  }

  const onMeasureDeleteBtn = () => {
    ReactTooltip.hide()
    viewer.gizmoMeasure.abort()
    onMeasureBtn()
  }

  const onToggleIsolationBtn = () => {
    toggleIsolation()
    //viewer.camera.frame(getVisibleBoundingBox(viewer), 'none', viewer.camera.defaultLerpDuration)
  }

  const btnSection = actionButton('Sectioning Mode', onSectionBtn, Icons.sectionBox, false)
  const btnIsolation = actionButton('Toggle Isolation', onToggleIsolationBtn, Icons.toggleIsolation, false)
  const btnMeasure =  actionButton("Measuring Mode", onMeasureBtn, Icons.measure, false)
  const toolsTab = <div className='vim-menu-section flex items-center bg-white rounded-full px-2 mx-4 shadow-md'>
    <div className='mx-1'>{btnSection}</div>
    <div className='mx-1'>{btnIsolation}</div>
    <div className='mx-1'>{btnMeasure}</div>
  </div> 

  const btnMeasureDelete = actionButton('Delete', onMeasureDeleteBtn, Icons.trash, (measuring ? true : false))
  const btnMeasureConfirm = actionButton('Done', onMeasureBtn, Icons.checkmark, (measuring ? true : false))
  const measureTab = <div className='vim-menu-section flex items-center bg-primary rounded-full px-2 mx-4 shadow-md'>
    <div className='mx-1'>{btnMeasureDelete}</div>
    <div className='mx-1'>{btnMeasureConfirm}</div>
  </div>

  const btnSectionDelete = actionButton('Reset Section Box', onResetSectionBtn, Icons.sectionBoxReset, (section ? true : false))
  const btnSectionClip = actionButton('Hide Section', onSectionClip, Icons.sectionBoxClip, (section ? true : false))
  const btnSectionNoClip = actionButton('Show Section', onSectionNoClip, Icons.sectionBoxNoClip, (section ? true : false))
  const btnSectionConfirm = actionButton('Done', onSectionBtn, Icons.checkmark, (section ? true : false))
  const sectionTab = <div className='vim-menu-section flex items-center bg-primary rounded-full px-2 mx-4 shadow-md'>
  <div className='mx-1'>{btnSectionDelete}</div>
  <div className='mx-1'>{clip ? btnSectionNoClip : btnSectionClip}</div>
  <div className='mx-1'>{btnSectionConfirm}</div>
</div>

  // There is a weird bug with tooltips not working properly
  // if measureTab or sectionTab do not have the same number of buttons as toolstab

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