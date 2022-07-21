
import React, { useEffect, useState } from 'react'
import logo from './assets/logo.png'

import * as VIM from 'vim-webgl-viewer/'
import './style.css'

import {MenuTop} from './menuTop'
import {MenuTools} from './menuTools'
import {LoadingBox} from './loadingBox'
import {BimPanel} from './bimPanel'
import {MenuMore} from './menuMore'

export function createContainer(viewer: VIM.Viewer){
  const root = document.createElement('div')
  root.className = 'vim-component'
  root.style.height = '100%'
  document.body.append(root)

  root.append(viewer.viewport.canvas)

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

  useEffect(() => {
    props.onMount()
    props.viewer.viewport.canvas.tabIndex =0
  }, [])

  const [moreMenuVisible, setMoreMenuVisible] = useState(false)
  console.log('render component')
  return (
    <>
      {useLogo ? <Logo /> : null}
      {useLoading ? <LoadingBox viewer={props.viewer}/> : null}
      {useInspector ? <BimPanel viewer={props.viewer}/> : null}
      {useMenu ? <MenuTools viewer={props.viewer} moreMenuVisible={moreMenuVisible} setMoreMenuVisible = {setMoreMenuVisible}/> : null}
      {useMenuTop ? <MenuTop viewer={props.viewer}/> : null}
      {moreMenuVisible ?  <MenuMore viewer={props.viewer}/> : null}
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