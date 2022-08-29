
import React, { RefObject, useEffect, useRef, useState } from 'react'
import ReactTooltip from 'react-tooltip';
import logo from './assets/logo.png'
import imageHelpControls from './assets/help_controls.png'
import { showMenu} from "@firefox-devtools/react-contextmenu";

import * as VIM from 'vim-webgl-viewer/'

import {MenuTop} from './menuTop'
import {ControlBar} from './controlBar'
import {LoadingBox} from './loadingBox'
import {BimPanel} from './bimPanel'
import {MenuMore} from './menuMore'
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
  const useLogo = props.logo === undefined ? true: props.logo
  const useInspector = props.bimPanel === undefined ? true: props.bimPanel
  const useMenu = props.menu === undefined ? true: props.menu
  const useMenuTop = props.menuTop === undefined ? true: props.menuTop
  const useLoading = props.loading === undefined ? true: props.loading

  const [ortho, setOrtho] = useState<boolean>(props.viewer.camera.orthographic)
  const [orbit, setOrbit] = useState<boolean>(props.viewer.camera.orbitMode)
  const [moreMenuVisible, setMoreMenuVisible] = useState(false)
  const [helpVisible, setHelpVisible] = useState(false)
  const [sideContent, setSideContent] = useState<SideContent>('none')
  const [settings, setSettings] = useState(new Settings())

  let sideContentRef = useRef(sideContent)
  let settingsRef = useRef(settings)

  const viewer= props.viewer
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

  const onContextMenu = (click: MouseEvent) => {
    let showMenuConfig = {
      position: { x:click.clientX, y:click.clientY },
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
    props.viewer.camera.rotate(new VIM.THREE.Vector2(-0.25, 0))
    props.viewer.viewport.canvas.tabIndex =0
    props.viewer.gizmoSection.clip = true
    document.addEventListener('keyup',() => setTimeout(synchOrbit))
    props.viewer.viewport.canvas.addEventListener('contextmenu', onContextMenu)

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
      {useMenu ? <ControlBar viewer={props.viewer} openHelp = {() => setHelpVisible(true) } sideContent ={sideContent} setSideContent = {setSideContent}/> : null}
      {useMenuTop ? <MenuTop viewer={props.viewer} orbit ={orbit} setOrbit = {updateOrbit} ortho = {ortho} setOrtho = {updateOrtho}/> : null}
      <SidePanel viewer={props.viewer} content={getSidePanelContent} />
      <ReactTooltip delayShow={200}/>
      <VimContextMenu viewer={props.viewer} settings={settings}/>
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
