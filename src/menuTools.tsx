import React, { useRef } from 'react'
import { useState } from 'react'
import * as VIM from 'vim-webgl-viewer/'
import * as Icons from './icons'


export function MenuTools(props: {viewer: VIM.Viewer, moreMenuVisible:boolean, setMoreMenuVisible: (b:boolean) => void }){
  const viewer = props.viewer
  const [section, setSection] = useState(false)
  const [measuring, setMeasuring] = useState(false)
  const [measurement, setMeasurement] = useState<VIM.THREE.Vector3>()
  
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
      viewer.camera.frame(viewer.renderer.section.box.getBoundingSphere(new VIM.THREE.Sphere()), 'none', viewer.camera.defaultLerpDuration)
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

  const btnSection = <button data-tip="Section Box" onClick={onSectionButton} className={`rounded-full text-white h-10 w-10 flex items-center justify-center transition-all hover:scale-110 hover:bg-hover-t40 ${section ? 'bg-primary-royal hover:bg-primary-royal' : ''}`} type="button"><Icons.Box height="24" width="24" fill="currentColor" /></button>
  const btnMeasure = <button data-tip="Measuring Tool" onClick={onMeasureBtn} className={`rounded-full text-white h-10 w-10 flex items-center justify-center transition-all hover:scale-110 hover:bg-hover-t40 ${measuring ? 'bg-primary-royal hover:bg-primary-royal' : ''}`} type="button"><Icons.Measure height="24" width="24" fill="currentColor" /></button>
  const btnMore = <button data-tip="Open Menu" onClick={onMoreBtn} className={`rounded-full text-white h-10 w-10 flex items-center justify-center transition-all hover:scale-110 hover:bg-hover-t40 ${props.moreMenuVisible ? 'bg-primary-royal hover:bg-primary-royal' : ''}`} type="button"><Icons.More height="24" width="24" fill="currentColor" /></button>


  const txtMeasure = <ul className='flex text-white mr-auto'>
    <li key="dist" className='mr-3'><strong>Dist</strong>: {measurement?.length().toFixed(2)}</li>
    <li key="x" className='mr-3'><strong>X</strong>: {measurement?.x.toFixed(2)}</li>
    <li key="y" className='mr-3'><strong>Y</strong>: {measurement?.y.toFixed(2)}</li>
    <li key="z" className='mr-3'><strong>Z</strong>: {measurement?.z.toFixed(2)}</li>
  </ul>
  
  return <div className={`vim-menu flex items-center justify-end w-full fixed px-2 bottom-0 py-2 ${measuring ? 'bg-hover-t40' : ''}`}>
    {measuring ? txtMeasure : ''}
    <div className='mx-1'>{btnSection}</div>
    <div className='mx-1'>{btnMeasure}</div>
    <div className='mx-1'>{btnMore}</div>
  </div>
}