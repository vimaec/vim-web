import React, { useEffect, useMemo, useRef, useState } from 'react'
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
import { applySettings, Settings } from './helpers/settings'
import {
  getAllVisible,
  getVisibleObjects,
  setAllVisible,
  setBehind,
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
  root: HTMLDivElement
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

  const getVim = () => viewer.selection.vim ?? viewer.vims[0]
  const [selection, setSelection] = useState<VIM.Object[]>([
    ...viewer.selection.objects
  ])
  const [vim, setVim] = useState<VIM.Vim>(getVim())
  const [highlight] = useState<Highlighter>(new Highlighter(props.viewer))

  useEffect(() => {
    applySettings(viewer, settings)
  }, [settings])

  useEffect(() => {
    setBehind(helpVisible)
  }, [helpVisible])

  // On first render
  useEffect(() => {
    props.onMount()
    cursorManager.register()

    // register to viewer state changes
    const subVim = viewer.onVimLoaded.subscribe(() => setVim(getVim()))
    const subSel = viewer.selection.onValueChanged.subscribe(() => {
      setVim(getVim())
      setSelection([...viewer.selection.objects])
      if (viewer.selection.count > 0) {
        side.set('bim')
      }
    })

    props.viewer.inputs.onContextMenu = showContextMenu

    // Frame on vim loaded
    const subLoad = viewer.onVimLoaded.subscribe(() => {
      viewer.camera.frame('all', 45)
    })

    props.viewer.inputs.strategy = new ComponentInputs(
      props.viewer,
      () => settings,
      highlight
    )

    // dispose
    return () => {
      cursorManager.unregister()
      subLoad()
      subVim()
      subSel()
    }
  }, [])

  const sidePanel = (
    <>
      <BimPanel
        viewer={props.viewer}
        vim={vim}
        selection={selection}
        visible={side.getCurrent() === 'bim'}
      />
      <MenuSettings
        visible={side.getCurrent() === 'settings'}
        viewer={props.viewer}
        settings={settings}
        setSettings={setSettings}
      />
    </>
  )

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
        visible={side.getCurrent() !== 'none'}
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
      {useMemo(
        () => (
          <MenuToast viewer={props.viewer}></MenuToast>
        ),
        []
      )}
    </>
  )
}

const Logo = React.memo(() => (
  <div className="vim-logo">
    <a href="https://vimaec.com">
      <img src={logo}></img>
    </a>
  </div>
))

function createSideState () {
  const [side, setSide] = useState<SideContent[]>(['bim'])
  const sideRef = useRef(side)

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
    return sideRef.current[sideRef.current.length - 1] ?? 'none'
  }

  const set = (value: SideContent) => {
    sideRef.current = [value]
    setSide([value])
  }

  return { set, getCurrent, toggleSide, pop, getNav }
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

export class Highlighter {
  private _viewer: VIM.Viewer
  private _highlight: VIM.THREE.Mesh
  private _material: VIM.THREE.Material
  constructor (viewer: VIM.Viewer) {
    this._viewer = viewer

    this._material = new VIM.THREE.MeshBasicMaterial({
      depthTest: false,
      opacity: 0.2,
      color: new VIM.THREE.Color(1, 1, 1),
      transparent: true
    })
  }

  highlight (object: VIM.Object) {
    if (this._highlight) {
      this._highlight?.geometry.dispose()
      this._viewer.renderer.remove(this._highlight)
    }
    if (!object) return
    const geometry = object.createGeometry()
    const mesh = new VIM.THREE.Mesh(geometry, this._material)
    this._viewer.renderer.add(mesh)
    this._highlight = mesh
  }
}
