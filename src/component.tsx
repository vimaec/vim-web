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

import { ComponentInputs as ComponentInputScheme } from './helpers/inputs'
import { CursorManager } from './helpers/cursor'
import { applySettings, Settings } from './helpers/settings'
import {
  getAllVisible,
  isolate,
  setAllVisible,
  setBehind
} from './utils/viewerUtils'

import { ArrayEquals } from './utils/dataUtils'

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
  const side = createSideState(useInspector)
  const isolation = createIsolationState(viewer, settings)
  const [cursorManager] = useState(new CursorManager(props.viewer))

  const getVim = () => viewer.selection.vim ?? viewer.vims[0]
  const [selection, setSelection] = useState<VIM.Object[]>([
    ...viewer.selection.objects
  ])
  const [vim, setVim] = useState<VIM.Vim>(getVim())

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

    props.viewer.inputs.onContextMenu.subscribe(showContextMenu)

    // Frame on vim loaded
    const subLoad = viewer.onVimLoaded.subscribe(() => {
      viewer.camera.frame('all', 45)
    })

    props.viewer.inputs.scheme = new ComponentInputScheme(
      props.viewer,
      isolation.toggle
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
        isolation={isolation}
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
          isolation={isolation}
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
        isolation={isolation}
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

function createSideState (useInspector: boolean) {
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
    const result = sideRef.current[sideRef.current.length - 1] ?? 'none'
    if (result && !useInspector) return 'none'
    return result
  }

  const set = (value: SideContent) => {
    sideRef.current = [value]
    setSide([value])
  }

  return { set, getCurrent, toggleSide, pop, getNav }
}

export type Isolation = {
  search: (objects: VIM.Object[]) => void
  current: () => VIM.Object[]
  toggle: () => void
  hide: () => void
  clear: () => void
  onChange: (action: () => void) => void
}
function createIsolationState (
  viewer: VIM.Viewer,
  settings: Settings
): Isolation {
  const isolationRef = useRef<VIM.Object[]>()
  const lastIsolation = useRef<VIM.Object[]>()
  const changed = useRef<() => void>()

  useEffect(() => {
    viewer.renderer.onVisibilityChanged.subscribe((vim) => {
      if (getAllVisible(viewer)) {
        isolationRef.current = undefined
      }
    })
  }, [])

  const onChange = (action: () => void) => {
    changed.current = action
  }

  const current = () => {
    return isolationRef.current
  }

  const search = (objects: VIM.Object[]) => {
    if (isolationRef.current) {
      lastIsolation.current = isolationRef.current
    }

    isolate(viewer, settings, objects)
    isolationRef.current = objects
  }

  const toggle = () => {
    const selection = [...viewer.selection.objects]

    if (isolationRef.current) {
      lastIsolation.current = isolationRef.current
    }
    if (isolationRef.current) {
      if (
        selection.length === 0 ||
        ArrayEquals(isolationRef.current, selection)
      ) {
        // Cancel isolation
        setAllVisible(viewer)
        isolationRef.current = undefined
      } else {
        // Replace Isolation
        isolate(viewer, settings, selection)
        isolationRef.current = selection
      }
    } else {
      if (selection.length > 0) {
        // Set new Isolation
        isolate(viewer, settings, selection)
        isolationRef.current = selection
      } else if (lastIsolation.current) {
        // Restore last isolation
        isolate(viewer, settings, lastIsolation.current)
        isolationRef.current = [...lastIsolation.current]
      }
    }
    changed.current()
  }

  const hide = () => {
    const selection = new Set(viewer.selection.objects)
    const initial = isolationRef.current ?? viewer.vims[0].getAllObjects()
    const result: VIM.Object[] = []
    for (const obj of initial) {
      if (!selection.has(obj)) result.push(obj)
    }
    isolate(viewer, settings, result)
    isolationRef.current = result
    changed.current()
  }

  const clear = () => {
    setAllVisible(viewer)
    isolationRef.current = undefined
    changed.current()
  }
  return { search, toggle, hide, clear, current, onChange }
}
