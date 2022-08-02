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


  const btnOrbit = <button data-tip={props.orbit ? "Orbit" : "Free"} onClick={() => props.setOrbit(!props.orbit)} className={"rounded-full text-white h-8 w-8 flex items-center justify-center transition-all opacity-80 hover:opacity-100"} type="button">{props.orbit ? <Icons.Orbit height="20" width="20" fill="currentColor" /> : <Icons.FirstPerson height="20" width="20" fill="currentColor" />}</button>
  const btnOrtho = <button data-tip={props.ortho ? "Orthographic" : "Perspective"}  onClick={() => props.setOrtho(!props.ortho)} className={"rounded-full text-white h-8 w-8 flex items-center justify-center transition-all opacity-80 hover:opacity-100"} type="button">{props.ortho ? <Icons.Orthographic height="20" width="20" fill="currentColor" /> : <Icons.Perspective height="20" width="20" fill="currentColor" />}</button>
  const btnCamera = <div data-tip="Speed" className={"rounded-full text-white text-sm h-8 w-8 flex items-center justify-center transition-all opacity-75"}><Icons.Camera height="20" width="20" fill="currentColor" />{speed}</div>
  
  return <div className='vim-top flex flex-col fixed right-6 top-6 w-auto pointer-events-none'>
    <div className='border border-hover-t40 h-28 w-full rounded-t-md pointer-events-none' > </div>
    <div className="flex bg-hover-t40 p-1 rounded-b-md pointer-events-auto">
      <div className='mx-1'>{btnOrbit}</div>
      <div className='mx-1'>{btnOrtho}</div>
      <div className='mx-1'>{btnCamera}</div>
    </div>
  </div>
}
