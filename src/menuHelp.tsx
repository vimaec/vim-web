import React, { useEffect, useRef } from "react";
import { useState } from 'react'
import helpImage from './assets/quick-controls.svg'
import * as Icons from './icons'

const urlSupport = 'https://support.vimaec.com'
const urlControls = 'https://support.vimaec.com/en/articles/5872168-navigation-and-controls'

export function MenuHelp(props:{closeHelp: () => void}){

const onCloseBtn = () =>{
  console.log('close')
  props.closeHelp()
}
const onControlsBtn = () =>{
  window.open(urlControls)
}
const onHelpBtn = () =>{
  window.open(urlSupport)
}

return <>
  <div className="menu-help-overlay absolute inset-0 bg-white/50 px-[10%] py-[30%]" onClick={onCloseBtn}>
    <div className="menu-help-safezone py-5" onClick={(e) =>{e.stopPropagation()}}>
      <button className="menu-help-close w-4 h-4" onClick={onCloseBtn}>{Icons.close({height:"24px",width:"24px", fill:"currentColor" })}</button>
      <img className="menu-help-controls mb-8" src={helpImage}></img>
      <button className="text-white text-xs font-bold uppercase bg-primary hover:bg-primary-royal rounded-full py-2 px-8 mr-4" onClick={onControlsBtn}>Full Control List</button>
      <button className="text-white text-xs font-bold uppercase bg-primary hover:bg-primary-royal rounded-full py-2 px-8" onClick={onHelpBtn}>Help Center</button>
      </div>
  </div>
</>

}