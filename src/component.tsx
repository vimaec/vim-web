
import React, { useEffect, useState } from 'react'
import logo from './assets/logo.png'

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

  useEffect(() => {
    props.onMount()
    props.viewer.viewport.canvas.tabIndex =0
    props.viewer.gizmoSection.clip = true
    document.addEventListener('keyup',() => setTimeout(synchOrbit))
  }, [])

  const [moreMenuVisible, setMoreMenuVisible] = useState(false)
  return (
    <>
      {useLogo ? <Logo /> : null}
      {useLoading ? <LoadingBox viewer={props.viewer}/> : null}
      {useInspector ? <BimPanel viewer={props.viewer}/> : null}
      {useMenu ? <MenuTools viewer={props.viewer} moreMenuVisible={moreMenuVisible} setMoreMenuVisible = {setMoreMenuVisible}/> : null}
      {useMenuTop ? <MenuTop viewer={props.viewer} orbit ={orbit} setOrbit = {updateOrbit} ortho = {ortho} setOrtho = {updateOrtho}/> : null}
      {moreMenuVisible ?  <MenuMore viewer={props.viewer} orbit ={orbit} setOrbit = {updateOrbit} ortho = {ortho} setOrtho = {updateOrtho}/> : null}
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