
import React, { RefObject, useEffect, useRef, useState } from 'react'
import ReactTooltip from 'react-tooltip';
import logo from './assets/logo.png'
import imageHelpControls from './assets/help_controls.png'
import { ContextMenu, MenuItem, showMenu} from "@firefox-devtools/react-contextmenu";

import * as VIM from 'vim-webgl-viewer/'

import {MenuTop} from './menuTop'
import {MenuTools} from './menuTools'
import {LoadingBox} from './loadingBox'
import {BimPanel} from './bimPanel'
import {MenuMore} from './menuMore'

import './style.css'

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
  const [helpControlsVisible, setHelpControlsVisible] = useState(false)

  const toggleHelpControls = () => setHelpControlsVisible(!helpControlsVisible)
  
  let moreMenuRef = useRef<HTMLUListElement>();

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
    console.log('CONTEXT MENU')
    
    let showMenuConfig = {
      position: { x:click.clientX, y:click.clientY },
      target: window,
      id: 'TEST'
    }

    showMenu(showMenuConfig)
  }


  useEffect(() => {
    props.onMount()
    props.viewer.viewport.canvas.tabIndex =0
    props.viewer.gizmoSection.clip = true
    document.addEventListener('keyup',() => setTimeout(synchOrbit))
    props.viewer.viewport.canvas.addEventListener('contextmenu', onContextMenu)

    
    addEventListener('focusin', () =>{
      if(!moreMenuRef.current) return
      if(!moreMenuRef.current.contains(document.activeElement)){
        setMoreMenuVisible(false)
      }
    })
    
  }, [])


  return (
    <>
      {useLogo ? <Logo /> : null}
      {helpControlsVisible ? <HelpControls/> : null}
      {useLoading ? <LoadingBox viewer={props.viewer}/> : null}
      {useMenu ? <MenuTools viewer={props.viewer} moreMenuVisible={moreMenuVisible} setMoreMenuVisible = {setMoreMenuVisible}/> : null}
      {useMenuTop ? <MenuTop viewer={props.viewer} orbit ={orbit} setOrbit = {updateOrbit} ortho = {ortho} setOrtho = {updateOrtho}/> : null}
      {moreMenuVisible ? <MenuMore ref={moreMenuRef} viewer={props.viewer} hide={() => setMoreMenuVisible(false)} orbit ={orbit} setOrbit = {updateOrbit} ortho = {ortho} setOrtho = {updateOrtho} helpVisible={helpControlsVisible} setHelpVisible={setHelpControlsVisible}/> : null}
      {useInspector ? <BimPanel viewer={props.viewer}/> : null}
      <ReactTooltip delayShow={200}/>
      <TestMenu viewer={props.viewer}/>
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

function HelpControls () {
  return (
    <div className="vim-help-controls">
      <img className='m-auto' src={imageHelpControls}></img>
    </div>
  )
}

function TestMenu(props :{viewer: VIM.Viewer }){
  const viewer = props.viewer


  const someHidden = () => {
    for(const vim of viewer.vims){
      for (const obj of vim.getAllObjects()) {
        if(!obj.visible){
          return true
        }
      }
    }
    return false
  }

  const [objects, setObject] = useState<VIM.Object[]>([])
  const [hidden, setHidden] = useState<boolean>(someHidden())
  const [ghost, setGhost] = useState<boolean>(false)
  const [section, setSection] = useState<boolean>(false)

  useEffect( () => {
    const old = viewer.selection.onValueChanged
    viewer.selection.onValueChanged = () => {
      old?.()
      setObject([...viewer.selection.objects])
      }
    
    viewer.gizmoSection.onBoxConfirm = () => {
      const clipping = !viewer.gizmoSection.box.containsBox(viewer.renderer.getBoundingBox())
      setSection(clipping)
    }
  }
  ,[])

  const onFrameBtn = () => {
    const sphere = viewer.selection.getBoundingBox().getBoundingSphere(new VIM.THREE.Sphere())
    viewer.camera.frame(sphere, 'center', viewer.camera.defaultLerpDuration)
  }

  const onHideBtn = () => {
    for (const obj of objects) {
      obj.visible = false
    }
    viewer.selection.clear()
    setHidden(true)
  }
  
  const onIsolateBtn = () => {
    const set = new Set(objects)
    const vim = viewer.selection.vim
    for (const obj of vim.getAllObjects()) {
      obj.visible = set.has(obj)
      if(obj.visible) console.log(obj)
    }
    vim.scene.material = ghost ? viewer.renderer.materials.isolation : undefined
    setHidden(true)
  }

  const onShowAllBtn = () => {
    viewer.vims.forEach((v) => {
      for (const obj of v.getAllObjects()) {
        obj.visible = true
      }
      v.scene.material = undefined
    })
    setHidden(false)
  }

  const onResetBtn = () => {
    viewer.camera.frame(viewer.renderer.getBoundingSphere(), 45, viewer.camera.defaultLerpDuration)
  }

  const onGhostBtn = () => {
    const next = !ghost
    const mat = next ? viewer.renderer.materials.isolation : undefined
    viewer.vims.forEach(v => {
      v.scene.material = mat
    })
    setGhost(next)
  }

  const onResetSectionBtn = () => {
    viewer.gizmoSection.fitBox(viewer.renderer.getBoundingBox())
  }

  const hasSelection = objects.length > 0
  console.log(hasSelection)


  

  return <div className='test'>
    <ContextMenu id='TEST'>

      <MenuItem data={{foo: 'bar'}} onClick={onResetBtn} >
          Reset Camera
      </MenuItem>
      {
        section ?
        <MenuItem data={{foo: 'bar'}} onClick={onResetSectionBtn} >
          Reset Section Box
        </MenuItem>
        : null
      }

      <MenuItem className={ghost ?'checked':''} data={{foo: 'bar'}} onClick={onGhostBtn} >
          Display Ghosts
      </MenuItem>
      {
        hasSelection ?
        <>
          <MenuItem data={{foo: 'bar'}} onClick={onFrameBtn} >
            Frame
          </MenuItem>
          <MenuItem data={{foo: 'bar'}} onClick={onHideBtn}  >
            Hide
          </MenuItem>
          <MenuItem data={{foo: 'bar'}} onClick={onIsolateBtn} >
            Isolate
          </MenuItem>
        </>
      : null
      }
      { hidden ?
        <MenuItem data={{foo: 'bar'}} onClick={onShowAllBtn} >
          Show All
        </MenuItem>
        : null
      }
    </ContextMenu>
  </div>

}