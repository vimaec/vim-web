import React from "react";
import { useState } from 'react'
import * as VIM from 'vim-webgl-viewer/'

export function MenuMore(props: {
  viewer: VIM.Viewer
  ortho: boolean,
  setOrtho:  (b:boolean) => void,
  orbit: boolean,
  setOrbit : (b:boolean) => void  }
 ){

  const [sectionIgnore, setSectionIgnore] = useState(!props.viewer.gizmoSection.clip)


  const onSectionIgnoreBtn = () =>{
    props.viewer.gizmoSection.clip = sectionIgnore
    setSectionIgnore(!sectionIgnore)
  }

  const onSectionResetBtn = () =>{
    props.viewer.gizmoSection.fitBox(props.viewer.renderer.getBoundingBox())
  }

  return <div className="vim-menu-more bottom-16 right-4 absolute bg-white py-5 rounded shadow-lg">
    <ul className="text-gray-warn">
      <li className="py-2 px-12"><h4 className="text-xs font-bold text-gray uppercase">Navigation mode</h4></li>
      <li className={`py-2 px-12 hover:bg-gray-lightest ${props.orbit ? 'text-primary submenu-item-active' : ''}`} key={'vim-menu-more-navigation-orbit'}>
        <button className="w-full text-left" onClick={() => props.setOrbit(true)} >Orbit</button>
      </li>
      <li className={`py-2 px-12 hover:bg-gray-lightest ${!props.orbit ? 'text-primary submenu-item-active' : ''}`} key={'vim-menu-more-navigation-first'}>
        <button className="w-full text-left" onClick={() => props.setOrbit(false)}>First Person</button>
      </li>
      <li><hr className="border-gray-lighter my-2" /></li>
      <li className="py-2 px-12"><h4 className="text-xs font-bold text-gray uppercase">Camera projection</h4></li>
      <li className={`py-2 px-12 hover:bg-gray-lightest ${!props.ortho ? 'text-primary submenu-item-active' : ''}`} key={'vim-menu-more-projection-persp'}>
        <button className="w-full text-left" onClick={() => props.setOrtho(false)} >Perspective</button>
      </li>
      <li className={`py-2 px-12 hover:bg-gray-lightest ${props.ortho ? 'text-primary submenu-item-active' : ''}`} key={'vim-menu-more-projection-ortho'}>
        <button className="w-full text-left" onClick={() => props.setOrtho(true)} >Orthographic</button>
      </li>
      <li><hr className="border-gray-lighter my-2" /></li>
      <li className= {`py-2 px-12 hover:bg-gray-lightest ${ sectionIgnore ? 'text-primary submenu-item-active' : ''}`} key={'vim-menu-more-section-ignore'}>
        <button onClick={onSectionIgnoreBtn}>Ignore Section Box</button>
      </li>
      <li className="py-2 px-12 hover:bg-gray-lightest" key={'vim-menu-more-section-reset'}>
        <button onClick={onSectionResetBtn}>Reset Section Box</button>
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