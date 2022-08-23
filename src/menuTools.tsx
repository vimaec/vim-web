import React, { useEffect, useRef } from 'react'
import { useState } from 'react'
import * as VIM from 'vim-webgl-viewer/'
import * as Icons from './icons'


export function MenuTools(props: {viewer: VIM.Viewer, moreMenuVisible:boolean, setMoreMenuVisible: (b:boolean) => void }){
  const viewer = props.viewer
  const [section, setSection] = useState(false)
  const [measuring, setMeasuring] = useState(false)
  const [measurement, setMeasurement] = useState<VIM.THREE.Vector3>()
  const [mode, setMode] = useState<VIM.PointerMode>(viewer.inputs.pointerMode)
  
  // Need a ref to get the up to date value in callback.
  const measuringRef = useRef<boolean>()
  measuringRef.current = measuring

  const onSectionButton = function (){
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
      onSectionButton()
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

  const onMoreBtn = () =>{
    // End other activities on menu button.
    if(measuring){
      onMeasureBtn()
    }
    if(section){
      onSectionButton()
    }
    props.setMoreMenuVisible(!props.moreMenuVisible)
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
  const onDollyBtn = () => { onModeBtn('dolly')}
  const onFrameRectBtn = () => { onModeBtn('zone')}


  const onFrameBtn = () => {
    const target = viewer.selection.count > 0
     ? viewer.selection
     : viewer.renderer
    viewer.camera.frame(target.getBoundingBox(), 'center', viewer.camera.defaultLerpDuration)
  }

  const btnOrbit = <button data-tip="Orbit" onClick={onOrbitBtn} className={`rounded-full text-black h-10 w-10 flex items-center justify-center transition-all hover:scale-110 hover:bg-hover-t40 ${mode === 'orbit' ? 'bg-primary-royal hover:bg-primary-royal' : ''}`} type="button"><Icons.Orbit height="24" width="24" fill="currentColor" /></button>
  const btnLook = <button data-tip="First Person" onClick={onLookBtn} className={`rounded-full text-black h-10 w-10 flex items-center justify-center transition-all hover:scale-110 hover:bg-hover-t40 ${mode === 'look' ? 'bg-primary-royal hover:bg-primary-royal' : ''}`} type="button"><Icons.FirstPerson height="24" width="24" fill="currentColor" /></button>
  const btnPan = <button data-tip="Pan" onClick={onPanBtn} className={`rounded-full text-black h-10 w-10 flex items-center justify-center transition-all hover:scale-110 hover:bg-hover-t40 ${mode === 'pan' ? 'bg-primary-royal hover:bg-primary-royal' : ''}`} type="button"><Icons.More height="24" width="24" fill="currentColor" /></button>
  const btnDolly = <button data-tip="Dolly" onClick={onDollyBtn} className={`rounded-full text-black h-10 w-10 flex items-center justify-center transition-all hover:scale-110 hover:bg-hover-t40 ${mode === 'dolly' ? 'bg-primary-royal hover:bg-primary-royal' : ''}`} type="button"><Icons.More height="24" width="24" fill="currentColor" /></button>
  const btnFrameRect = <button data-tip="Frame Rectangle" onClick={onFrameRectBtn} className={`rounded-full text-black h-10 w-10 flex items-center justify-center transition-all hover:scale-110 hover:bg-hover-t40 ${mode === 'zone' ? 'bg-primary-royal hover:bg-primary-royal' : ''}`} type="button"><Icons.Box height="24" width="24" fill="currentColor" /></button>
  const btnFrame = <button data-tip="Frame" onClick={onFrameBtn} className={`rounded-full text-black h-10 w-10 flex items-center justify-center transition-all hover:scale-110 hover:bg-hover-t40`} type="button"><Icons.Box height="24" width="24" fill="currentColor" /></button>
  const btnFullScreen = <button data-tip="Full Screen" onClick={() => console.log('Full Screen')} className={`rounded-full text-black h-10 w-10 flex items-center justify-center transition-all hover:scale-110 hover:bg-hover-t40`} type="button"><Icons.Perspective height="24" width="24" fill="currentColor" /></button>

  const btnSection = <button data-tip="Section Box" onClick={() => console.log('Section Box')} className={`rounded-full text-black h-10 w-10 flex items-center justify-center transition-all hover:scale-110 hover:bg-hover-t40 ${section ? 'bg-primary-royal hover:bg-primary-royal' : ''}`} type="button"><Icons.Box height="24" width="24" fill="currentColor" /></button>
  const btnMystery = <button data-tip="Mystery" onClick={() => console.log('Mystery')} className={`rounded-full text-black h-10 w-10 flex items-center justify-center transition-all hover:scale-110 hover:bg-hover-t40`} type="button"><Icons.Orthographic height="24" width="24" fill="currentColor" /></button>
  const btnMeasure = <button data-tip="Measuring Tool" onClick={() => console.log('Measuring Tool')} className={`rounded-full text-black h-10 w-10 flex items-center justify-center transition-all hover:scale-110 hover:bg-hover-t40 ${measuring ? 'bg-primary-royal hover:bg-primary-royal' : ''}`} type="button"><Icons.Measure height="24" width="24" fill="currentColor" /></button>
  
  const btnTreeView = <button data-tip="Tree view" onClick={() => console.log('Full Screen')} className={`rounded-full text-black h-10 w-10 flex items-center justify-center transition-all hover:scale-110 hover:bg-hover-t40`} type="button"><Icons.More height="24" width="24" fill="currentColor" /></button>
  const btnSettings = <button data-tip="Settings" onClick={() => console.log('Settings')} className={`rounded-full text-black h-10 w-10 flex items-center justify-center transition-all hover:scale-110 hover:bg-hover-t40`} type="button"><Icons.More height="24" width="24" fill="currentColor" /></button>
  const btnHelp = <button data-tip="Help" onClick={() => console.log('Help')} className={`rounded-full text-black h-10 w-10 flex items-center justify-center transition-all hover:scale-110 hover:bg-hover-t40`} type="button"><Icons.More height="24" width="24" fill="currentColor" /></button>

  return <div className='vim-menu flex items-center justify-center w-full fixed px-2 bottom-0 py-2 divide-x-2 bg-white'>
    <div className ='vim-menu-section flex items-center'>
      <div className='mx-1'>{btnOrbit}</div>
      <div className='mx-1'>{btnLook}</div>
      <div className='mx-1'>{btnPan}</div>
      <div className='mx-1'>{btnDolly}</div>
      <div className='mx-1'>{btnFrameRect}</div>
      <div className='mx-1'>{btnFrame}</div>
      <div className='mx-1'>{btnFullScreen}</div>
    </div>
    <div className='divider'/>
    <div className='vim-menu-section flex items-center' >
      <div className='mx-1'>{btnSection}</div>
      <div className='mx-1'>{btnMystery}</div>
      <div className='mx-1'>{btnMeasure}</div>
    </div>
    <div className='divider'/>
    <div className='vim-menu-section flex items-center'>
      <div className='mx-1'>{btnTreeView}</div>
      <div className='mx-1'>{btnSettings}</div>
      <div className='mx-1'>{btnHelp}</div>
    </div>
  </div>
}