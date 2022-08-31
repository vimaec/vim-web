
import React, { useEffect, useRef, useState } from 'react'
import ReactTooltip from 'react-tooltip';
import logo from './assets/logo.png'
import { showMenu} from "@firefox-devtools/react-contextmenu";

import * as VIM from 'vim-webgl-viewer/'
export * as VIM from 'vim-webgl-viewer/'

import {MenuTop} from './menuTop'
import {ControlBar} from './controlBar'
import {LoadingBox} from './loadingBox'
import {BimPanel} from './bimPanel'
import { VimContextMenu, VIM_CONTEXT_MENU_ID } from './contextMenu'
import {MenuHelp} from './menuHelp'
import {SidePanel} from './menuSide'
import {MenuSettings} from './menuSettings'

import './style.css'
import pathGround from './assets/vim-floor-soft.png'


export type SideContent = 'none' | 'bim' |'settings'

export class Settings {
  useIsolationMaterial: boolean = true
  showInspectorOnSelect: boolean  = true
  showGroundPlane: boolean = true

  clone(){
     return Object.assign(new Settings(), this) as Settings
  }
}

export function createContainer(viewer: VIM.Viewer){
  const root = document.createElement('div')
  root.className = 'vim-component'
  root.style.height = '100%'
  document.body.append(root)

  // container for canvases
  const gfx = document.createElement('div')
  gfx.className = 'vim-gfx'
  gfx.style.height = '100%'
  root.append(gfx)

  gfx.append(viewer.viewport.canvas)
  gfx.append(viewer.axesCanvas)

  // container for ui
  const ui = document.createElement('div')
  ui.className = 'vim-ui'
  ui.style.height = '100%'
  root.append(ui)

  viewer.camera.rotate(new VIM.THREE.Vector2(-0.25, 0))
  viewer.viewport.canvas.tabIndex =0
  viewer.gizmoSection.clip = true

  return ui
}

export function VimComponent (props: {
  viewer: VIM.Viewer,
  onMount: () => void,
  logo?: boolean,
  bimPanel?: boolean,
  menu?: boolean,
  menuTop?: boolean,
  loading?: boolean
}) {
  const viewer= props.viewer
  const useLogo = props.logo === undefined ? true: props.logo
  const useInspector = props.bimPanel === undefined ? true: props.bimPanel
  const useMenu = props.menu === undefined ? true: props.menu
  const useMenuTop = props.menuTop === undefined ? true: props.menuTop
  const useLoading = props.loading === undefined ? true: props.loading

  const [ortho, setOrtho] = useState<boolean>(viewer.camera.orthographic)
  const [orbit, setOrbit] = useState<boolean>(viewer.camera.orbitMode)
  const [helpVisible, setHelpVisible] = useState(false)
  const [sideContent, setSideContent] = useState<SideContent>('none')
  const [settings, setSettings] = useState(new Settings())
  const [toast, setToast] = useState<ToastConfig>()
  const [isolation, setIsolation] = useState<VIM.Object[]>()
  const [hidden, setHidden] = useState(!getAllVisible(viewer))
  
  const toastTimeout = useRef(0)
  const toastSpeed = useRef(0)
  let sideContentRef = useRef(sideContent)
  let settingsRef = useRef(settings)
  
  const updateOrtho = (b: boolean) => {
    setOrtho(b)
    props.viewer.camera.orthographic = b
  }

  const updateOrbit = (b: boolean) => {
    setOrbit(b)
    props.viewer.camera.orbitMode = b
  }

  const synchOrbit = () => {
    setOrbit(props.viewer.camera.orbitMode)
  }

  const resetIsolation = () =>{
    setIsolation(undefined)
  }

  const toggleIsolation = () =>{
    if(!isolation){
      if(getAllVisible(viewer)){
        toGhost(viewer)
      }
      else{
        setIsolation(getVisibleObjects(viewer))
        showAll(viewer)
      }
    }
    else{
      toGhost(viewer)
      isolation.forEach((o) => {
        o.visible = true
      })
      resetIsolation()
    }
    setHidden(!getAllVisible(viewer))
  }


  const onContextMenu = (position: VIM.THREE.Vector2) => {
    let showMenuConfig = {
      position: { x:position.x, y:position.y },
      target: window,
      id: VIM_CONTEXT_MENU_ID
    }

    showMenu(showMenuConfig)
  }
  useEffect(() =>{
    props.viewer.environment.loadGroundTexture(pathGround)
    applySettings(props.viewer, settings)
    settingsRef.current = settings
  },[settings])
  useEffect(() =>{
    sideContentRef.current = sideContent
  },[sideContent])


  const updateSide = () => {
    const showBim =
      props.viewer.selection.count > 0 &&
      sideContentRef.current === 'none' &&
      settingsRef.current.showInspectorOnSelect
    if(showBim){
      setSideContent('bim')
    }
  }

  useEffect(() => {
    props.onMount()
    document.addEventListener('keyup',() => setTimeout(synchOrbit))
    props.viewer.inputs.onContextMenu = onContextMenu

    // Camera speed toast
    props.viewer.camera.onChanged = () => {
      console.log(`viewer: ${props.viewer.camera.speed}, ref: ${toastSpeed.current}`)
      if(props.viewer.camera.speed !== toastSpeed.current){
        toastSpeed.current = props.viewer.camera.speed
        setToast({speed: props.viewer.camera.speed})
        clearTimeout(toastTimeout.current)
        toastTimeout.current = setTimeout(() => setToast(undefined), 1000)
      }
    }

    const old = props.viewer.selection.onValueChanged
    props.viewer.selection.onValueChanged = 
    () => {
      old?.()
      updateSide()
    }

    // Override F button
    const oldKey = props.viewer.inputs.onKeyAction
    props.viewer.inputs.onKeyAction = (key) => {
      if(key === 70){
        const box = viewer.selection.count > 0
          ? getVisibleBoundingBox(viewer.selection.vim)
          : getVisibleBoundingBox(viewer)
          
          viewer.camera.frame(box, 'none', viewer.camera.defaultLerpDuration)
        return true
      }
      return oldKey(key)
    }

  },[])


  const getSidePanelContent =() => {
    switch(sideContent){
      case 'bim': return <BimPanel viewer={props.viewer}/>
      case 'settings' : return <MenuSettings viewer={props.viewer} settings ={settings} setSettings={setSettings} />
      default: return null
    }
  }

  return (
    <>
      {helpVisible ? <MenuHelp closeHelp={() => setHelpVisible(false)}/> : null}
      {useLogo ? <Logo /> : null}
      {useLoading ? <LoadingBox viewer={props.viewer}/> : null}
      {useMenu ? <ControlBar viewer={props.viewer} helpVisible = {helpVisible} setHelpVisible = {setHelpVisible} sideContent ={sideContent} setSideContent = {setSideContent} toggleIsolation={toggleIsolation}  /> : null}
      {useMenuTop ? <MenuTop viewer={props.viewer} orbit ={orbit} setOrbit = {updateOrbit} ortho = {ortho} setOrtho = {updateOrtho}/> : null}
      <SidePanel viewer={props.viewer} content={getSidePanelContent} />
      <ReactTooltip delayShow={200}/>
      <VimContextMenu viewer={props.viewer} settings={settings} helpVisible = {helpVisible} setHelpVisible = {setHelpVisible} resetIsolation={resetIsolation} hidden = {hidden} setHidden={setHidden}/>
      <MenuToast config={toast}></MenuToast>
    </>
  )
}

function Logo () {
  return (
    <div className="vim-logo">
      <a href="https://vimaec.com">
        <img src={logo}></img>
      </a>
    </div>
  )
}

function applySettings(viewer: VIM.Viewer, settings: Settings){
  

  // Isolation material
  viewer.vims.forEach(v => {
    if(!settings.useIsolationMaterial)
    {
      v.scene.material = undefined
      return
    }

    let hidden = false
    for (const obj of v.getAllObjects()){
      if(!obj.visible){
        hidden = true
        break
      }
    }
    if(hidden){
      v.scene.material = viewer.renderer.materials.isolation
    }

    // Don't show ground plane when isolation is on.
    viewer.environment.groundPlane.visible = settings.showGroundPlane && !hidden
      
  })
}

type ToastConfigSpeed = {
  speed: number
}

type ToastConfig = ToastConfigSpeed | undefined

function MenuToast(props: {config: ToastConfig}){
  console.log('MenuToast :' + props.config)
  if(!props.config)
    return null

  return <div className='vim-menu-toast'>
    <h1 className='text-lg font-bold text-white mx-2'>Speed: {props.config.speed +25}</h1>
  </div>
}


export function toGhost(source: VIM.Viewer | VIM.Vim ){
  const vimToGhost = (vim: VIM.Vim) => {
    for (const obj of vim.getAllObjects()) {
      obj.visible = false
    }
    vim.scene.material = vim.scene.builder.meshBuilder.materials.isolation
  }
  if(source instanceof VIM.Viewer){
    for (const vim of source.vims) {
      vimToGhost(vim)
    }
  }
  else{
    vimToGhost(source)
  }
}


export function showAll(source: VIM.Viewer | VIM.Vim ){
  const vimShowAll = (vim: VIM.Vim) => {
    for (const obj of vim.getAllObjects()) {
      obj.visible = true
    }
    vim.scene.material = undefined
  }
  if(source instanceof VIM.Viewer){
    for (const vim of source.vims) {
      vimShowAll(vim)
    }
  }
  else{
    vimShowAll(source)
  }
}


export function getVisibleObjects(source: VIM.Viewer | VIM.Vim ){
  const all : VIM.Object[] = []
  const vimAllObjects = (vim: VIM.Vim) => {
    for (const obj of vim.getAllObjects()) {
      if(obj.visible){
        all.push(obj)
      }
    }
  }
  if(source instanceof VIM.Viewer){
    for (const vim of source.vims) {
      vimAllObjects(vim)
    }
  }
  else{
    vimAllObjects(source)
  }
  return all
}


export function getObjects(source: VIM.Viewer | VIM.Vim ){
  const all : VIM.Object[] = []
  const vimAllObjects = (vim: VIM.Vim) => {
    for (const obj of vim.getAllObjects()) {
      all.push(obj)
    }
  }
  if(source instanceof VIM.Viewer){
    for (const vim of source.vims) {
      vimAllObjects(vim)
    }
  }
  else{
    vimAllObjects(source)
  }
  return all
}


export function getAllVisible(source: VIM.Viewer | VIM.Vim ){
  const vimAllVisible = (vim: VIM.Vim) => {
    for (const obj of vim.getAllObjects()) {
      if(!obj.visible) return false
    }
    return true
  }
  if(source instanceof VIM.Viewer){
    for (const vim of source.vims) {
      if(!vimAllVisible(vim)) return false
    }
    return true
  }
  else{
    return vimAllVisible(source)
  }
}

// Utils
export function getVisibleBoundingBox(source: VIM.Viewer | VIM.Vim ){
  let box : THREE.Box3

  const vimBoxUnion = (vim : VIM.Vim) => {
    for (const obj of vim.getAllObjects()) {
      if(!obj.visible) continue
      const b = obj.getBoundingBox()
      box = box ? box.union(b) : b.clone()
    }
  }
  if(source instanceof VIM.Viewer){
    for (const vim of source.vims) {
      vimBoxUnion(vim)
    }
  }
  else{
    vimBoxUnion(source)
  }

  return box ?? new VIM.THREE.Box3() 
}
