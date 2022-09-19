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

import './style.css'
import 'vim-webgl-viewer/dist/style.css'
import { InputAction } from 'vim-webgl-viewer/dist/types/vim-webgl-viewer/raycaster'

export * as VIM from 'vim-webgl-viewer/'
export type SideContent = 'none' | 'bim' | 'settings'

type ToastConfigSpeed = {
  visible: boolean
  speed: number
}
type ToastConfig = ToastConfigSpeed | undefined

export type Cursor =
  | 'cursor-regular'
  | 'cursor-orbit'
  | 'cursor-look'
  | 'cursor-pan'
  | 'cursor-zoom'
  | 'cursor-rect'
  | 'cursor-measure'
  | 'cursor-section-box'

export function pointerToCursor (pointer: VIM.PointerMode): Cursor {
  switch (pointer) {
    case 'orbit':
      return 'cursor-orbit'
    case 'look':
      return 'cursor-look'
    case 'pan':
      return 'cursor-pan'
    case 'zoom':
      return 'cursor-zoom'
    case 'rect':
      return 'cursor-rect'
    default:
      return 'cursor-regular'
  }
}

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

export class Settings {
  useIsolationMaterial: boolean = true
  showGroundPlane: boolean = true
  showPerformance: boolean = true

  clone () {
    return Object.assign(new Settings(), this) as Settings
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
  const [sideContent, setSideContent] = useState<SideContent>('bim')
  const [settings, setSettings] = useState(new Settings())
  const [toast, setToast] = useState<ToastConfig>()
  const [isolation, setIsolation] = useState<VIM.Object[]>()
  const [hidden, setHidden] = useState(!getAllVisible(viewer))

  const toastTimeout = useRef<ReturnType<typeof setTimeout>>()
  const toastSpeed = useRef(0)
  const sideContentRef = useRef(sideContent)
  const settingsRef = useRef(settings)
  const cursor = useRef<Cursor>()
  const boxHover = useRef<boolean>()

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

  const updateSide = () => {
    const showBim =
      props.viewer.selection.count > 0 && sideContentRef.current === 'none'
    if (showBim) {
      setSideContent('bim')
    }
  }

  const setCursor = (value: Cursor) => {
    if (value === cursor.current) return
    if (!cursor.current) {
      viewer.viewport.canvas.classList.add(value)
    } else {
      viewer.viewport.canvas.classList.replace(cursor.current, value)
    }
    cursor.current = value
  }

  const updateCursor = () => {
    const cursor = props.viewer.inputs.pointerOverride
      ? pointerToCursor(props.viewer.inputs.pointerOverride)
      : boxHover.current
        ? 'cursor-section-box'
        : pointerToCursor(props.viewer.inputs.pointerMode)
    setCursor(cursor)
  }

  // On first render
  useEffect(() => {
    props.onMount()

    // Update and Register cursor for pointers
    setCursor(pointerToCursor(props.viewer.inputs.pointerMode))
    props.viewer.inputs.onPointerModeChanged.subscribe(updateCursor)
    props.viewer.inputs.onPointerOverrideChanged.subscribe(updateCursor)
    props.viewer.sectionBox.onHover.subscribe((hover) => {
      boxHover.current = hover
      updateCursor()
    })

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

    props.viewer.selection.onValueChanged.subscribe(() => updateSide())
    props.viewer.inputs.strategy = new ComponentInputStrategy(props.viewer)
  }, [])

  const getSidePanelContent = () => {
    switch (sideContent) {
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
          sideContent={sideContent}
          setSideContent={setSideContent}
          toggleIsolation={toggleIsolation}
          setCursor={setCursor}
        />
          )
        : null}
      {useMenuTop ? <MenuTop viewer={props.viewer} /> : null}
      <SidePanel viewer={props.viewer} content={getSidePanelContent} />
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

function applySettings (viewer: VIM.Viewer, settings: Settings) {
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

function MenuToast (props: { config: ToastConfig }) {
  if (!props.config) return null

  return (
    <div
      className={`vim-menu-toast rounded shadow-lg py-2 px-5 flex items-center justify-between transition-all ${
        props.config.visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <span className="text-sm uppercase font-semibold text-gray-light">
        Speed:
      </span>
      <span className="font-bold text-lg text-white ml-1">
        {props.config.speed + 25}
      </span>
    </div>
  )
}

/* Utils */
export function resetCamera (viewer: VIM.Viewer) {
  viewer.camera.reset()
  viewer.camera.frame('all', 45)
}

export function frameContext (viewer: VIM.Viewer) {
  const box =
    viewer.selection.count > 0
      ? viewer.selection.getBoundingBox()
      : getVisibleBoundingBox(viewer)

  viewer.camera.frame(box, 'none', viewer.camera.defaultLerpDuration)
}

export function isolateSelection (viewer: VIM.Viewer, settings: Settings) {
  const set = new Set(viewer.selection.objects)
  const vim = viewer.selection.vim
  for (const obj of vim.getAllObjects()) {
    obj.visible = set.has(obj)
  }

  vim.scene.material = settings.useIsolationMaterial
    ? viewer.renderer.materials.isolation
    : undefined
  viewer.camera.frame(
    getVisibleBoundingBox(vim),
    'none',
    viewer.camera.defaultLerpDuration
  )
}

export function hideSelection (viewer: VIM.Viewer, settings: Settings) {
  for (const obj of viewer.selection.objects) {
    obj.visible = false
  }

  const vim = viewer.selection.vim
  vim.scene.material = settings.useIsolationMaterial
    ? viewer.renderer.materials.isolation
    : undefined

  viewer.selection.clear()
}

export function showAll (viewer: VIM.Viewer, settings: Settings) {
  viewer.vims.forEach((v) => {
    for (const obj of v.getAllObjects()) {
      obj.visible = true
    }
    v.scene.material = undefined
  })
}

export function toGhost (source: VIM.Viewer | VIM.Vim) {
  const vimToGhost = (vim: VIM.Vim) => {
    for (const obj of vim.getAllObjects()) {
      obj.visible = false
    }
    vim.scene.material = vim.scene.builder.meshBuilder.materials.isolation
  }
  if (source instanceof VIM.Viewer) {
    for (const vim of source.vims) {
      vimToGhost(vim)
    }
  } else {
    vimToGhost(source)
  }
}

export function setAllVisible (source: VIM.Viewer | VIM.Vim) {
  const vimShowAll = (vim: VIM.Vim) => {
    for (const obj of vim.getAllObjects()) {
      obj.visible = true
    }
    vim.scene.material = undefined
  }
  if (source instanceof VIM.Viewer) {
    for (const vim of source.vims) {
      vimShowAll(vim)
    }
  } else {
    vimShowAll(source)
  }
}

export function getVisibleObjects (source: VIM.Viewer | VIM.Vim) {
  const all: VIM.Object[] = []
  const vimAllObjects = (vim: VIM.Vim) => {
    for (const obj of vim.getAllObjects()) {
      if (obj.visible) {
        all.push(obj)
      }
    }
  }
  if (source instanceof VIM.Viewer) {
    for (const vim of source.vims) {
      vimAllObjects(vim)
    }
  } else {
    vimAllObjects(source)
  }
  return all
}

export function getObjects (source: VIM.Viewer | VIM.Vim) {
  const all: VIM.Object[] = []
  const vimAllObjects = (vim: VIM.Vim) => {
    for (const obj of vim.getAllObjects()) {
      all.push(obj)
    }
  }
  if (source instanceof VIM.Viewer) {
    for (const vim of source.vims) {
      vimAllObjects(vim)
    }
  } else {
    vimAllObjects(source)
  }
  return all
}

export function getAllVisible (source: VIM.Viewer | VIM.Vim) {
  const vimAllVisible = (vim: VIM.Vim) => {
    for (const obj of vim.getAllObjects()) {
      if (!obj.visible) return false
    }
    return true
  }
  if (source instanceof VIM.Viewer) {
    for (const vim of source.vims) {
      if (!vimAllVisible(vim)) return false
    }
    return true
  } else {
    return vimAllVisible(source)
  }
}

export function getVisibleBoundingBox (source: VIM.Viewer | VIM.Vim) {
  let box: VIM.THREE.Box3

  const vimBoxUnion = (vim: VIM.Vim) => {
    for (const obj of vim.getAllObjects()) {
      if (!obj.visible) continue
      const b = obj.getBoundingBox()
      box = box ? box.union(b) : b.clone()
    }
  }
  if (source instanceof VIM.Viewer) {
    for (const vim of source.vims) {
      vimBoxUnion(vim)
    }
  } else {
    vimBoxUnion(source)
  }

  return box
}
