import React, { useEffect, useRef, useState } from 'react'
import ReactTooltip from 'react-tooltip'
import logo from './assets/logo.png'
import './style.css'
import 'vim-webgl-viewer/dist/style.css'

import * as VIM from 'vim-webgl-viewer/'

import { MenuTop } from './menuTop'
import { ControlBar } from './controlBar'
import { LoadingBox } from './loadingBox'
import { BimPanel } from './bimPanel'
import { showContextMenu, VimContextMenu } from './contextMenu'
import { MenuHelp } from './menuHelp'
import { SidePanel } from './menuSide'
import { MenuSettings } from './menuSettings'
import { MenuToast } from './menuToast'

import { ComponentInputs } from './helpers/inputs'
import { CursorManager } from './helpers/cursor'
import { Settings } from './helpers/settings'
import {
  getAllVisible,
  getVisibleObjects,
  setAllVisible,
  toGhost
} from './utils/viewerUtils'

export * as VIM from 'vim-webgl-viewer/'
export type SideContent = 'none' | 'bim' | 'settings'

export function createContainer (viewer: VIM.Viewer) {
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
  gfx.append(viewer.viewport.text)
  gfx.append(viewer.axesCanvas)

  // container for ui
  const ui = document.createElement('div')
  ui.className = 'vim-ui'
  ui.style.height = '100%'
  root.append(ui)

  // Initial viewer settings
  viewer.viewport.canvas.tabIndex = 0
  viewer.sectionBox.clip = true

  return { root, ui, gfx }
}

export function VimComponent (props: {
  viewer: VIM.Viewer
  onMount: () => void
  logo?: boolean
  bimPanel?: boolean
  menu?: boolean
  menuTop?: boolean
  loading?: boolean
}) {
  const viewer = props.viewer
  const useLogo = props.logo === undefined ? true : props.logo
  // eslint-disable-next-line no-unused-vars
  const useInspector = props.bimPanel === undefined ? true : props.bimPanel
  const useMenu = props.menu === undefined ? true : props.menu
  const useMenuTop = props.menuTop === undefined ? true : props.menuTop
  const useLoading = props.loading === undefined ? true : props.loading

  const [helpVisible, setHelpVisible] = useState(false)
  const [settings, setSettings] = useState(new Settings())
  const side = createSideState()
  const isolation = createIsolationState(viewer)
  const [cursorManager] = useState(new CursorManager(props.viewer))

  // On first render
  useEffect(() => {
    props.onMount()
    cursorManager.register()

    props.viewer.inputs.onContextMenu = showContextMenu
    viewer.onVimLoaded.subscribe(() => {
      viewer.camera.frame('all', 45)
    })

    props.viewer.selection.onValueChanged.subscribe(() => {
      if (props.viewer.selection.count > 0 && side.getCurrent() !== 'bim') {
        side.setSide(['bim'])
      }
    })

    props.viewer.inputs.strategy = new ComponentInputs(props.viewer)
  }, [])

  // Select content of side panel
  const last = side.getCurrent()
  const sidePanel =
    last === 'bim'
      ? (
      <BimPanel viewer={props.viewer} />
        )
      : last === 'settings'
        ? (
      <MenuSettings
        viewer={props.viewer}
        settings={settings}
        setSettings={setSettings}
      />
          )
        : null

  return (
    <>
      {helpVisible
        ? (
        <MenuHelp closeHelp={() => setHelpVisible(false)} />
          )
        : null}
      {useLogo ? <Logo /> : null}
      {useLoading ? <LoadingBox viewer={props.viewer} /> : null}
      {useMenu
        ? (
        <ControlBar
          viewer={props.viewer}
          helpVisible={helpVisible}
          setHelpVisible={setHelpVisible}
          side={side.getCurrent()}
          toggleSide={side.toggleSide}
          toggleIsolation={isolation.toggle}
          setCursor={cursorManager.setCursor}
        />
          )
        : null}
      {useMenuTop ? <MenuTop viewer={props.viewer} /> : null}
      <SidePanel
        viewer={props.viewer}
        content={sidePanel}
        popSide={side.pop}
        getSideNav={side.getNav}
      />
      <ReactTooltip delayShow={200} />
      <VimContextMenu
        viewer={props.viewer}
        settings={settings}
        helpVisible={helpVisible}
        setHelpVisible={setHelpVisible}
        resetIsolation={isolation.reset}
        hidden={isolation.hidden}
        setHidden={isolation.setHidden}
      />
      <MenuToast viewer={props.viewer}></MenuToast>
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

function createSideState () {
  const [side, setSide] = useState<SideContent[]>(['bim'])
  const sideRef = useRef(side)

  // On side content change
  useEffect(() => {
    sideRef.current = side
  }, [side])

  const toggleSide = (content: SideContent) => {
    let r
    const [A, B] = sideRef.current
    if (!A && !B) r = [content]
    else if (A === content && !B) r = []
    else if (A !== content && !B) r = [A, content]
    else if (A && B === content) r = [A]
    else if (A && B !== content) r = [content]
    sideRef.current = r
    setSide(r)
  }
  const pop = () => {
    sideRef.current.pop()
    setSide([...sideRef.current])
  }
  const getNav = () => {
    return sideRef.current.length > 1 ? 'back' : 'close'
  }

  const getCurrent = () => {
    return sideRef.current[sideRef.current.length - 1]
  }

  return { getCurrent, setSide, toggleSide, pop, getNav }
}

function createIsolationState (viewer: VIM.Viewer) {
  const [isolation, setIsolation] = useState<VIM.Object[]>()
  const [hidden, setHidden] = useState(!getAllVisible(viewer))

  const reset = () => {
    setIsolation(undefined)
  }

  const toggle = () => {
    if (!isolation) {
      if (getAllVisible(viewer)) {
        toGhost(viewer)
      } else {
        setIsolation(getVisibleObjects(viewer))
        setAllVisible(viewer)
      }
    } else {
      toGhost(viewer)
      isolation.forEach((o) => {
        o.visible = true
      })
      reset()
    }
    setHidden(!getAllVisible(viewer))
  }
  return { hidden, setHidden, toggle, reset }
}
