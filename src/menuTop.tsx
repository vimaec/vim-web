import React, { useEffect } from 'react'
import { useState } from 'react'
import { clamp } from 'three/src/math/MathUtils'
import * as VIM from 'vim-webgl-viewer/'
import * as Icons from './icons'
import ReactTooltip from 'react-tooltip';

export function MenuTop(props: {
  viewer: VIM.Viewer,
  ortho: boolean,
  setOrtho:  (b:boolean) => void,
  orbit: boolean,
  setOrbit : (b:boolean) => void  }
){
  const [speed, setSpeed] = useState<number>() 
  const synchSpeed = () => {setSpeed(clamp(props.viewer.camera.speed + 25, 0, 50))}
  
  
  useEffect(() => {
    synchSpeed()
    props.viewer.viewport.canvas.addEventListener('wheel',() => setTimeout(synchSpeed))
    document.addEventListener('keyup',() => setTimeout(synchSpeed))
  },[])

  const onHomeBtn = () => {
    props.viewer.camera.frame(props.viewer.renderer.getBoundingBox(), 45, props.viewer.camera.defaultLerpDuration)
  }

  const btnHome = <button data-tip="Reset Camera" onClick={onHomeBtn } className={"rounded-full text-gray-medium h-8 w-8 flex items-center justify-center transition-all hover:text-primary-royal"} type="button"><Icons.home height="20" width="20" fill="currentColor" /> </button>
  const btnOrtho = <button data-tip={props.ortho ? "Orthographic" : "Perspective"}  onClick={() => props.setOrtho(!props.ortho)} className={"rounded-full text-gray-medium h-8 w-8 flex items-center justify-center transition-all hover:text-primary-royal"} type="button">{props.ortho ? <Icons.orthographic height="20" width="20" fill="currentColor" /> : <Icons.perspective height="20" width="20" fill="currentColor" />}</button>
  
  return <div className='vim-top flex flex-col fixed right-6 top-6 w-32 pointer-events-none  rounded-xl shadow-lg'>
    <div className='vim-top-background border border-white-t50 h-28 w-full rounded-t-xl pointer-events-none z-0' > </div>
    <div className="vim-top-buttons flex p-1 rounded-b-xl pointer-events-auto justify-center bg-white-t50">
      <div className='mx-1'>{btnOrtho}</div>
      <div className='mx-1'>{btnHome}</div>
    </div>
  </div>
}
