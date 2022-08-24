import React, { useEffect, useRef } from 'react'
import { useState } from 'react'
import * as VIM from 'vim-webgl-viewer/'
import * as Icons from './icons'


export function MenuTools(props: {viewer: VIM.Viewer, openHelp: () => void, bimPanelVisible: boolean, setBimPanelVisible : (value: boolean) => void}){
  const viewer = props.viewer
  const [section, setSection] = useState(false)
  const [measuring, setMeasuring] = useState(false)
  const [measurement, setMeasurement] = useState<VIM.THREE.Vector3>()
  const [mode, setMode] = useState<VIM.PointerMode>(viewer.inputs.pointerMode)
  
  // Need a ref to get the up to date value in callback.
  const measuringRef = useRef<boolean>()
  measuringRef.current = measuring

  const onSectionBtn = function (){
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
  
  const loopMeasure = () => {
    
    const onMouseMove = () =>{
      setMeasurement(props.viewer.gizmoMeasure.measurement)
    } 

    viewer.viewport.canvas.addEventListener('mousemove', onMouseMove)
    viewer.gizmoMeasure.measure()
    .then(() => {
      setMeasurement(viewer.gizmoMeasure.measurement)
    })
    .catch(() => {
      setMeasurement(undefined)
    })
    .finally(() => {
      viewer.viewport.canvas.removeEventListener('mousemove', onMouseMove)
      if(measuringRef.current) {
        loopMeasure()
      }
    })
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
      loopMeasure()
    }
  }

  const onModeBtn = (target: VIM.PointerMode) => {
    const next = mode === target ? 'normal' : target
    viewer.inputs.pointerMode = next
    setMode(next)
  }

  useEffect(() => {
    viewer.inputs.onPointerModeChanged = () => setMode(viewer.inputs.pointerMode)
  },[])

  const onOrbitBtn =  () => { onModeBtn('orbit')}
  const onLookBtn = () => { onModeBtn('look')}
  const onPanBtn = () => { onModeBtn('pan')}
  const onZoomBtn = () => { onModeBtn('dolly')}
  const onFrameRectBtn = () => { onModeBtn('zone')}


  const onFrameBtn = () => {
    const target = viewer.selection.count > 0
     ? viewer.selection
     : viewer.renderer
    viewer.camera.frame(target.getBoundingBox(), 'center', viewer.camera.defaultLerpDuration)
  }

  const btnStyle = 'rounded-full text-black h-10 w-10 flex items-center justify-center transition-all hover:scale-110 hover:bg-hover-t40'

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

  const onHelpBtn = () => {
    props.openHelp()
  }

  const onTreeViewBtn = () => {
    props.setBimPanelVisible(!props.bimPanelVisible)
  }

  const toggleButton = (tip: string, action : () => void, icon: ({height,width,fill}) => JSX.Element, isOn : ()=> boolean) => {
    return <button data-tip={tip} onClick={action} className={`${btnStyle} ${isOn() ? 'bg-primary-royal hover:bg-primary-royal' : ''}`} type="button">{icon({height:"24", width:"24", fill:"currentColor"})}</button>
  }

  const actionButton = (tip: string, action : () => void, icon: ({height,width,fill}) => JSX.Element) => {
    return <button data-tip={tip} onClick={action} className={btnStyle} type="button">{icon({height:"24", width:"24", fill:"currentColor"})}</button>
  }


  //Camera
  const btnOrbit = toggleButton('Orbit', onOrbitBtn, Icons.orbit, () => mode === 'orbit')
  const btnLook = toggleButton('Look', onLookBtn, Icons.look, () => mode === 'orbit')
  const btnPan = toggleButton('Pan', onPanBtn, Icons.pan, () => mode === 'pan')
  const btnZoom = toggleButton('Zoom', onZoomBtn, Icons.zoom, () => mode === 'dolly')
  const btnFrameRect = toggleButton('Frame Rectangle', onFrameRectBtn, Icons.frameRect, () => mode === 'zone')
  const btnFrame = actionButton('Frame Selection', onFrameBtn, Icons.frameSelection)
  const btnFullScreen = actionButton('Full Screen', () => console.log('Full Screen'), Icons.fullsScreen)

  
  // Tools
  const btnSection = actionButton('Section Box', onSectionBtn, Icons.box)
  const btnMystery = actionButton('Mystery', () => console.log("Mystery"), Icons.box)
  const btnMeasure =  actionButton("Measuring Tool", onMeasureBtn, Icons.measure)
  const toolsTab = <>
    <div className='mx-1'>{btnSection}</div>
    <div className='mx-1'>{btnMeasure}</div>
  </> 

  const btnMeasureDelete = actionButton('Clear', onMeasureDeleteBtn, Icons.trash)
  const btnMeasureUndo = actionButton('Undo', onMeasureUndoBtn, Icons.undo)
  const btnMeasureConfirm = actionButton('Done', onMeasureBtn, Icons.checkmark)
  const measureTab = <>
    <div className='mx-1'>{btnMeasureDelete}</div>
    <div className='mx-1'>{btnMeasureUndo}</div>
    <div className='mx-1'>{btnMeasureConfirm}</div>
  </>

  const btnSectionDelete = actionButton('Clear', onSectionDeleteBtn, Icons.trash)
  const btnSectionUndo = actionButton('Undo', onSectionUndoBtn, Icons.undo)
  const btnSectionConfirm = actionButton('Done', onSectionBtn, Icons.checkmark)
  const sectionTab = <>
  <div className='mx-1'>{btnSectionDelete}</div>
  <div className='mx-1'>{btnSectionUndo}</div>
  <div className='mx-1'>{btnSectionConfirm}</div>
</>

  // Right
  const btnTreeView = toggleButton("Tree View",onTreeViewBtn, Icons.treeView, ()=> props.bimPanelVisible)
  const btnSettings = actionButton("Settings", () => console.log('Settings'), Icons.settings)
  const btnHelp = actionButton("Help", onHelpBtn, Icons.help)

  return <div className='vim-menu flex items-center justify-center w-full fixed px-2 bottom-0 py-2 divide-x-2 bg-white'>
    <div className ='vim-menu-section flex items-center'>
      <div className='mx-1'>{btnOrbit}</div>
      <div className='mx-1'>{btnLook}</div>
      <div className='mx-1'>{btnPan}</div>
      <div className='mx-1'>{btnZoom}</div>
      <div className='mx-1'>{btnFrameRect}</div>
      <div className='mx-1'>{btnFrame}</div>
      <div className='mx-1'>{btnFullScreen}</div>
    </div>
    <div className='divider'/>
    <div className='vim-menu-section flex items-center' >
    {
      measuring ? measureTab
       : section ? sectionTab
       : toolsTab
    }
    </div>
    <div className='divider'/>
    <div className='vim-menu-section flex items-center'>
      <div className='mx-1'>{btnTreeView}</div>
      <div className='mx-1'>{btnSettings}</div>
      <div className='mx-1'>{btnHelp}</div>
    </div>
  </div>
}