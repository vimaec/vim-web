import React from 'react'
import { useState } from 'react'
import * as VIM from 'vim-webgl-viewer/'
import * as Icons from './icons'


export function MenuTools(props: {viewer: VIM.Viewer, moreMenuVisible: boolean, setMoreMenuVisible: (b: boolean) => void  }){
  const viewer = props.viewer
  const [section, setSection] = useState(false)
  const [measuring, setMeasuring] = useState(false)
  const [measurement, setMeasurement] = useState<VIM.THREE.Vector3>()
  
  const onHomeButton = function(){
    viewer.camera.frame('all', true, viewer.camera.defaultLerpDuration)
  }
  
  const onSectionButton = function (){
    viewer.gizmoSection.interactive = !section
    viewer.gizmoSection.visible = !section
    setSection(!section)
  }

  const onMeasureBtn = () => {
    if(measuring){
      viewer.gizmoMeasure.clear()
      setMeasuring(false)
    }
    else{
      setMeasurement(undefined)
      setMeasuring(true)
      viewer.gizmoMeasure.measure()
      .then(() => setMeasurement(viewer.gizmoMeasure.measurement))
      .catch(() => setMeasurement(undefined))
      .finally(() => setMeasuring(false))
    }
  }

  const onMoreBtn = () =>{
    props.setMoreMenuVisible(!props.moreMenuVisible)
  }

  const btnHome = <button onClick={onHomeButton} className={`rounded-full text-white h-12 w-12 flex items-center justify-center transition-all hover:scale-110 hover:bg-hover-t40 disabled:opacity-50`} type="button"><Icons.Home height="32" width="32" fill="currentColor" /></button>
  const btnSection = <button onClick={onSectionButton} className={`rounded-full text-white h-12 w-12 flex items-center justify-center transition-all hover:scale-110 hover:bg-hover-t40 ${section ? 'bg-primary-royal hover:bg-primary-royal' : ''}`} type="button"><Icons.Box height="32" width="32" fill="currentColor" /></button>
  const btnMeasure = <button onClick={onMeasureBtn} className={"rounded-full text-white h-12 w-12 flex items-center justify-center transition-all hover:scale-110 hover:bg-hover-t40"} type="button"><Icons.Measure height="32" width="32" fill="currentColor" /></button>
  const btnMore = <button onClick={onMoreBtn} className={"rounded-full text-white h-12 w-12 flex items-center justify-center transition-all hover:scale-110 hover:bg-hover-t40"} type="button"><Icons.More height="32" width="32" fill="currentColor" /></button>


  const txtMeasure = <div>
    Dist: {measurement?.length().toFixed(2)} <br/>
    X: {measurement?.x.toFixed(2)} <br/>
    Y: {measurement?.y.toFixed(2)} <br/>
    Z: {measurement?.z.toFixed(2)}
  </div>
  
  return <div className="vim-menu flex  fixed right-2 bottom-2">
    <div className='mx-1'>{btnSection}</div>
    <div className='mx-1'>{btnMeasure}</div>
    <div className='mx-1'>{btnHome}</div>
    <div className='mx-1'>{btnMore}</div>
  </div>
}