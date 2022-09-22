import React, { useEffect, useRef, useState } from 'react'
import ReactTooltip from 'react-tooltip'
import logo from './assets/logo.png'
import { showMenu } from '@firefox-devtools/react-contextmenu'

import * as VIM from 'vim-webgl-viewer/'

import { MenuTop } from './menuTop'
import { ControlBar } from './controlBar'
import { LoadingBox } from './loadingBox'
import { BimPanel } from './bimPanel'
import { VimContextMenu, VIM_CONTEXT_MENU_ID } from './contextMenu'
import { MenuHelp } from './menuHelp'
import { SidePanel } from './menuSide'
import { MenuSettings } from './menuSettings'
import { MenuToast, ToastConfig } from './menuToast'

import './style.css'
import 'vim-webgl-viewer/dist/style.css'
import { InputAction } from 'vim-webgl-viewer/dist/types/vim-webgl-viewer/raycaster'
import {
  getAllVisible,
  getVisibleBoundingBox,
  getVisibleObjects,
  setAllVisible,
  toGhost
} from './viewerUtils'
import { CursorManager } from './cursor'

export * as VIM from 'vim-webgl-viewer/'
export type SideContent = 'none' | 'bim' | 'settings'

class ComponentInputStrategy implements VIM.InputStrategy {
  private _viewer: VIM.Viewer
  private _default: VIM.InputStrategy

  constructor (viewer: VIM.Viewer) {
    this._viewer = viewer
    this._default = new VIM.DefaultInputStrategy(viewer)
  }

  onMainAction (hit: InputAction): void {
    this._default.onMainAction(hit)
  }

  onIdleAction (hit: InputAction): void {
    this._default.onIdleAction(hit)
  }

  onKeyAction (key: number): boolean {
    // F
    if (key === VIM.KEYS.KEY_F) {
      const box =
        this._viewer.selection.count > 0
          ? this._viewer.selection.getBoundingBox()
          : getVisibleBoundingBox(this._viewer)

      this._viewer.camera.frame(
        box,
        'none',
        this._viewer.camera.defaultLerpDuration
      )
      return true
    }
    return this._default.onKeyAction(key)
  }
}

export class ComponentSettings {
  useIsolationMaterial: boolean = true
  showGroundPlane: boolean = true
  showPerformance: boolean = true

  clone () {
    return Object.assign(new ComponentSettings(), this) as ComponentSettings
  }
}

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

export function showContextMenu (position: { x: number; y: number }) {
  const showMenuConfig = {
    position: { x: position.x, y: position.y },
    target: window,
    id: VIM_CONTEXT_MENU_ID
  }

  showMenu(showMenuConfig)
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

  const [settings, setSettings] = useState(new ComponentSettings())
  const [toast, setToast] = useState<ToastConfig>()
  const [isolation, setIsolation] = useState<VIM.Object[]>()
  const [hidden, setHidden] = useState(!getAllVisible(viewer))

  const toastTimeout = useRef<ReturnType<typeof setTimeout>>()
  const toastSpeed = useRef(0)

  const [sideContent, setSideContent] = useState<SideContent[]>(['bim'])
  const sideContentRef = useRef(sideContent)

  const toggleSide = (content: SideContent) => {
    let r
    const [A, B] = sideContentRef.current
    if (!A && !B) r = [content]
    else if (A === content && !B) r = []
    else if (A !== content && !B) r = [A, content]
    else if (A && B === content) r = [A]
    else if (A && B !== content) r = [content]
    sideContentRef.current = r
    setSideContent(r)
  }
  const popSide = () => {
    sideContentRef.current.pop()
    setSideContent([...sideContentRef.current])
  }
  const getSideNav = () => {
    return sideContentRef.current.length > 1 ? 'back' : 'close'
  }

  const settingsRef = useRef(settings)
  const [cursorManager] = useState(new CursorManager(props.viewer))

  const resetIsolation = () => {
    setIsolation(undefined)
  }

  const toggleIsolation = () => {
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
      resetIsolation()
    }
    setHidden(!getAllVisible(viewer))
  }

  // On side content change
  useEffect(() => {
    applySettings(props.viewer, settings)
    settingsRef.current = settings
  }, [settings])
  useEffect(() => {
    sideContentRef.current = sideContent
  }, [sideContent])

  // On first render
  useEffect(() => {
    props.onMount()
    cursorManager.register()
    // Update and Register cursor for pointers

    props.viewer.inputs.onContextMenu = showContextMenu
    viewer.onVimLoaded.subscribe(() => {
      viewer.camera.frame('all', 45)
    })

    // Camera speed toast
    props.viewer.camera.onValueChanged.subscribe(() => {
      if (props.viewer.camera.speed !== toastSpeed.current) {
        toastSpeed.current = props.viewer.camera.speed
        setToast({ visible: true, speed: props.viewer.camera.speed })
        clearTimeout(toastTimeout.current)
        toastTimeout.current = setTimeout(
          () => setToast({ visible: false, speed: props.viewer.camera.speed }),
          1000
        )
      }
    })

    props.viewer.selection.onValueChanged.subscribe(() => {
      const last = sideContentRef.current[sideContentRef.current.length - 1]
      if (props.viewer.selection.count > 0 && last !== 'bim') {
        sideContentRef.current = ['bim']
        setSideContent(['bim'])
      }
    })

    props.viewer.inputs.strategy = new ComponentInputStrategy(props.viewer)
  }, [])

  const getSidePanelContent = () => {
    const last = sideContent[sideContent.length - 1]
    switch (last) {
      case 'bim':
        return <BimPanel viewer={props.viewer} />
      case 'settings':
        return (
          <MenuSettings
            viewer={props.viewer}
            settings={settings}
            setSettings={setSettings}
          />
        )
      default:
        return null
    }
  }

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
          side={sideContent[sideContent.length - 1]}
          toggleSide={toggleSide}
          toggleIsolation={toggleIsolation}
          setCursor={cursorManager.setCursor}
        />
          )
        : null}
      {useMenuTop ? <MenuTop viewer={props.viewer} /> : null}
      <SidePanel
        viewer={props.viewer}
        content={getSidePanelContent}
        popSide={popSide}
        getSideNav={getSideNav}
      />
      <ReactTooltip delayShow={200} />
      <VimContextMenu
        viewer={props.viewer}
        settings={settings}
        helpVisible={helpVisible}
        setHelpVisible={setHelpVisible}
        resetIsolation={resetIsolation}
        hidden={hidden}
        setHidden={setHidden}
      />
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

function applySettings (viewer: VIM.Viewer, settings: ComponentSettings) {
  // Show/Hide performance gizmo
  const performance = document.getElementsByClassName('vim-performance')[0]
  if (performance) {
    if (settings.showPerformance) {
      performance.classList.remove('hidden')
    } else {
      performance.classList.add('hidden')
    }
  }

  // Isolation material
  viewer.vims.forEach((v) => {
    if (!settings.useIsolationMaterial) {
      v.scene.material = undefined
      return
    }

    let hidden = false
    for (const obj of v.getAllObjects()) {
      if (!obj.visible) {
        hidden = true
        break
      }
    }
    if (hidden) {
      v.scene.material = viewer.renderer.materials.isolation
    }

    // Don't show ground plane when isolation is on.
    viewer.environment.groundPlane.visible = settings.showGroundPlane
  })
}
