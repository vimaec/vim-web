import React from 'react'
import { useState } from 'react'
import * as VIM from 'vim-webgl-viewer/'
import * as Icons from './icons'

export function MenuTop(props: {viewer: VIM.Viewer}){
  const viewer = props.viewer
  const [orbit, setObit] = linkState(viewer.camera, 'orbitMode')
  const [ortho, setOrtho] = linkState(viewer.camera, 'orthographic')
  
  const btnOrbit = <button onClick={() => setObit(!orbit)} className={"rounded-full text-white h-8 w-8 flex items-center justify-center transition-all hover:scale-110 hover:bg-hover-t40"} type="button">{orbit ? <Icons.Orbit height="20" width="20" fill="currentColor" /> : <Icons.FirstPerson height="20" width="20" fill="currentColor" />}</button>
  const btnOrtho = <button onClick={() => setOrtho(!ortho)} className={"rounded-full text-white h-8 w-8 flex items-center justify-center transition-all hover:scale-110 hover:bg-hover-t40"} type="button">{ortho ? <Icons.Perspective height="20" width="20" fill="currentColor" /> : <Icons.Orthographic height="20" width="20" fill="currentColor" />}</button>
  const btnCamera = <button className={"rounded-full text-white text-sm h-8 w-8 flex items-center justify-center transition-all hover:scale-110 hover:bg-hover-t40 opacity-75"} type="button"><Icons.Camera height="20" width="20" fill="currentColor" />12</button>
   
  return <div className='flex flex-col mx-2 my-0 fixed right-0 top-2 w-auto'>
    <div className='border border-hover-t40 h-28 w-full rounded-t-md'> </div>
    <div className="vim-menu flex bg-hover-t40 p-1 rounded-b-md">
      <div className='mx-1'>{btnOrbit}</div>
      <div className='mx-1'>{btnOrtho}</div>
      <div className='mx-1'>{btnCamera}</div>
    </div>
  </div>
}


function linkState(o: Object, key: string){
  const [_, setState] = useState<boolean>(o[key])
  const {get, set} = patchProperty(o, key, setState.bind(o))
  return [get(), set]
}

function patchProperty(o: Object, key: string, onSet: (v:any) => void){
  
  const proto = Object.getPrototypeOf(o)
  const prev = Object.getOwnPropertyDescriptor(proto, key)

  const get = function(){ return prev.get.apply(o) }
  const set = function(value:any){{
    console.log('set' + key)
    prev.set.apply(o, [value])
    onSet(value)
  }}
  Object.defineProperty(o, key,
  {
    configurable : true,
    get: get,
    set:set,
  })
  return {get , set}
}