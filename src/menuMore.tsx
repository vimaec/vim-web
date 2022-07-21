import React from "react";
import { useState } from 'react'
import * as VIM from 'vim-webgl-viewer/'

export function MenuMore(props: {viewer: VIM.Viewer, moreMenuVisible: boolean, setMoreMenuVisible: (b: boolean) => void  }){
  const viewer = props.viewer
  const [orbit, setObit] = linkState(viewer.camera, 'orbitMode')
  const [ortho, setOrtho] = linkState(viewer.camera, 'orthographic')

  return <div className="vim-menu-more bottom-16 right-4 absolute bg-white py-5 rounded shadow-lg">
    <ul className="text-gray-warn">
      <li className="py-2 px-12"><h4 className="text-xs font-bold text-gray uppercase">Navigation mode</h4></li>
      <li className={`py-2 px-12 hover:bg-gray-lightest ${orbit ? 'text-primary submenu-item-active' : ''}`} key={'vim-menu-more-navigation-orbit'}>
        <button className="w-full text-left" onClick={() => setObit(true)} >Orbit</button>
      </li>
      <li className={`py-2 px-12 hover:bg-gray-lightest ${!orbit ? 'text-primary submenu-item-active' : ''}`} key={'vim-menu-more-navigation-first'}>
        <button className="w-full text-left" onClick={() => setObit(false)}>First Person</button>
      </li>
      <li><hr className="border-gray-lighter my-2" /></li>
      <li className="py-2 px-12"><h4 className="text-xs font-bold text-gray uppercase">Camera projection</h4></li>
      <li className={`py-2 px-12 hover:bg-gray-lightest ${ortho ? 'text-primary submenu-item-active' : ''}`} key={'vim-menu-more-projection-persp'}>
        <button className="w-full text-left" onClick={() => setOrtho(true)} >Perspective</button>
      </li>
      <li className={`py-2 px-12 hover:bg-gray-lightest ${!ortho ? 'text-primary submenu-item-active' : ''}`} key={'vim-menu-more-projection-ortho'}>
        <button className="w-full text-left" onClick={() => setOrtho(false)} >Orthographic</button>
      </li>
      <li><hr className="border-gray-lighter my-2" /></li>
      <li className="py-2 px-12 hover:bg-gray-lightest" key={'vim-menu-more-section-ignore'}>
        <button>Ignore Section Box</button>
      </li>
      <li className="py-2 px-12 hover:bg-gray-lightest" key={'vim-menu-more-section-reset'}>
        <button>Reset Section Box</button>
      </li>
      <li><hr className="border-gray-lighter my-2" /></li>
      <li className="py-2 px-12 hover:bg-gray-lightest" key={'vim-menu-more-controls'}>
        <button>Show Controls</button>
      </li>
      <li className="py-2 px-12 hover:bg-gray-lightest" key={'vim-menu-more-support'}>
        <button>Support Center</button>
      </li>
    </ul>
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