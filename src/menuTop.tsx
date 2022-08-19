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
    props.viewer.camera.frame(props.viewer.renderer.getBoundingSphere(), 45, props.viewer.camera.defaultLerpDuration)
  }

  const btnHome = <button data-tip="Reset Camera" onClick={onHomeBtn } className={"rounded-full text-black h-8 w-8 flex items-center justify-center transition-all opacity-80 hover:opacity-100"} type="button"><Icons.Home height="20" width="20" fill="currentColor" /> </button>
  const btnOrtho = <button data-tip={props.ortho ? "Orthographic" : "Perspective"}  onClick={() => props.setOrtho(!props.ortho)} className={"rounded-full text-black h-8 w-8 flex items-center justify-center transition-all opacity-80 hover:opacity-100"} type="button">{props.ortho ? <Icons.Orthographic height="20" width="20" fill="currentColor" /> : <Icons.Perspective height="20" width="20" fill="currentColor" />}</button>
  
  return <div className='vim-top flex flex-col fixed right-6 top-6 w-32 pointer-events-none'>
    <div className='border border-hover-t40 h-28 w-full rounded-t-md pointer-events-none bg-white opacity-20' > </div>
    <div className="flex p-1 rounded-b-md pointer-events-auto justify-center bg-white opacity-20">
      <div className='mx-1'>{btnOrtho}</div>
      <div className='mx-1'>{btnHome}</div>
    </div>
  </div>
}
