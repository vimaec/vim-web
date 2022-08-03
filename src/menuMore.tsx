import React, { useEffect, useRef } from "react";
import { useState } from 'react'
import * as VIM from 'vim-webgl-viewer/'
const urlSupport = 'https://support.vimaec.com'

export const MenuMore = React.forwardRef((
  props:{  viewer: VIM.Viewer
    hide: () => void, 
    ortho: boolean,
    setOrtho:  (b:boolean) => void,
    orbit: boolean,
    setOrbit : (b:boolean) => void,
    helpVisible: boolean,
    setHelpVisible: (b:boolean) => void
    }
  , ref : React.Ref<HTMLUListElement>) => 
 {

  const [sectionIgnore, setSectionIgnore] = useState(!props.viewer.gizmoSection.clip)

  const closeAnd = (func: () => void) => () => {
    props.hide()
    func()
  }

  const onSectionIgnoreBtn = () =>{
    props.viewer.gizmoSection.clip = sectionIgnore
    setSectionIgnore(!sectionIgnore)
  }

  const onSectionResetBtn = () =>{
    props.viewer.gizmoSection.fitBox(props.viewer.renderer.getBoundingBox())
  }
  
  return <div className="vim-menu-more bottom-16 right-4 absolute bg-white py-5 rounded shadow-lg">
    <ul ref={ref} tabIndex={0} className="text-gray-warn">
      <li className="py-2 px-12"><h4 className="text-xs font-bold text-gray uppercase">Navigation mode</h4></li>
      <li className={`py-2 px-12 hover:bg-gray-lightest ${props.orbit ? 'text-primary submenu-item-active' : ''}`} key={'vim-menu-more-navigation-orbit'}>
        <button className="w-full text-left" onClick={closeAnd(() => props.setOrbit(true))} >Orbit</button>
      </li>
      <li className={`py-2 px-12 hover:bg-gray-lightest ${!props.orbit ? 'text-primary submenu-item-active' : ''}`} key={'vim-menu-more-navigation-first'}>
        <button className="w-full text-left" onClick={closeAnd(() => props.setOrbit(false))}>First Person</button>
      </li>
      <li><hr className="border-gray-lighter my-2" /></li>
      <li className="py-2 px-12"><h4 className="text-xs font-bold text-gray uppercase">Camera projection</h4></li>
      <li className={`py-2 px-12 hover:bg-gray-lightest ${!props.ortho ? 'text-primary submenu-item-active' : ''}`} key={'vim-menu-more-projection-persp'}>
        <button className="w-full text-left" onClick={closeAnd(() => props.setOrtho(false))} >Perspective</button>
      </li>
      <li className={`py-2 px-12 hover:bg-gray-lightest ${props.ortho ? 'text-primary submenu-item-active' : ''}`} key={'vim-menu-more-projection-ortho'}>
        <button className="w-full text-left" onClick={closeAnd(() => props.setOrtho(true))} >Orthographic</button>
      </li>
      <li><hr className="border-gray-lighter my-2" /></li>
      <li className= {`py-2 px-12 hover:bg-gray-lightest ${ sectionIgnore ? 'text-primary submenu-item-active' : ''}`} key={'vim-menu-more-section-ignore'}>
        <button onClick={closeAnd(onSectionIgnoreBtn)}>Ignore Section Box</button>
      </li>
      <li className="py-2 px-12 hover:bg-gray-lightest" key={'vim-menu-more-section-reset'}>
        <button onClick={closeAnd(onSectionResetBtn)}>Reset Section Box</button>
      </li>
      <li><hr className="border-gray-lighter my-2" /></li>
      <li className={`py-2 px-12 hover:bg-gray-lightest ${props.helpVisible ? 'text-primary submenu-item-active' : ''}`} key={'vim-menu-more-controls'}>
        <button onClick={closeAnd(() => props.setHelpVisible(!props.helpVisible))}>Show Controls</button>
      </li>
      <li className="py-2 px-12 hover:bg-gray-lightest" key={'vim-menu-more-support'}>
        <button onClick={closeAnd(() => window.open(urlSupport))}>Support Center</button>
      </li>
    </ul>
</div>
})