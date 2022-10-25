import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import ReactTooltip from 'react-tooltip'
import logo from './assets/logo.png'
import './style.css'
import 'vim-webgl-viewer/dist/style.css'

import * as VIM from 'vim-webgl-viewer/'

import { AxesPanel } from './axesPanel'
import { ControlBar } from './controlBar'
import { LoadingBox } from './loading'
import { BimPanel } from './bim/bimPanel'
import { showContextMenu, VimContextMenu } from './contextMenu'
import { MenuHelp, useHelp } from './help'
import { SidePanel } from './sidePanel/sidePanel'
import { useSideState } from './sidePanel/sideState'
import { MenuSettings } from './settings/menuSettings'
import { MenuToast } from './toast'
import { Overlay } from './overlay'

import { ComponentInputs as ComponentInputScheme } from './helpers/inputs'
import { CursorManager } from './helpers/cursor'
import { Settings, useSettings } from './settings/settings'
import { Isolation, useIsolation } from './helpers/isolation'
import { ViewerWrapper } from './helpers/viewer'

export * as VIM from 'vim-webgl-viewer/'

export type ViewerComponent = {
  viewer: VIM.Viewer
  helpers: ViewerWrapper
  isolation: Isolation
}

// Creates a ui container along with a VIM.Viewer and the associated react component
export function createVimComponent (
  onMount: (component: ViewerComponent) => void,
  settings: Partial<Settings> = {}
) {
  const viewer = new VIM.Viewer()
  const container = createContainer(viewer)
  const root = createRoot(container.ui)
  const component = React.createFactory(VimComponent)
  root.render(component({ viewer, onMount, settings }))
  return { root, viewer }
}

// Creates a ui container for the react component
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

// React component that provides ui for the Vim Viewer.
export function VimComponent (props: {
  viewer: VIM.Viewer
  onMount: (component: ViewerComponent) => void
  settings?: Partial<Settings>
}) {
  const viewer = useRef(new ViewerWrapper(props.viewer)).current
  const cursor = useRef(new CursorManager(props.viewer)).current
  const settings = useSettings(props.viewer, props.settings)

  const isolation = useIsolation(viewer, settings.value)
  const side = useSideState(settings.value.useBimPanel)
  const help = useHelp()
  const [vim, selection] = useViewerState(props.viewer)

  // On first render
  useEffect(() => {
    props.onMount({ viewer: props.viewer, helpers: viewer, isolation })
    cursor.register()

    // Frame on vim loaded
    const subLoad = props.viewer.onVimLoaded.subscribe(() => {
      props.viewer.camera.frame('all', 45)
    })

    // Setup custom input scheme
    props.viewer.inputs.scheme = new ComponentInputScheme(viewer, isolation)

    // Register context menu
    const subContext =
      props.viewer.inputs.onContextMenu.subscribe(showContextMenu)

    // Clean up
    return () => {
      subLoad()
      subContext()
      cursor.register()
    }
  }, [])

  const sidePanel = (
    <>
      {settings.value.useBimPanel
        ? (
        <BimPanel
          viewer={viewer}
          vim={vim}
          selection={selection}
          visible={side.get() === 'bim'}
          isolation={isolation}
        />
          )
        : null}
      <MenuSettings
        visible={side.get() === 'settings'}
        viewer={props.viewer}
        settings={settings}
      />
    </>
  )

  return (
    <>
      <Overlay viewer={viewer.base} side={side}></Overlay>
      <MenuHelp help={help} />
      {settings.value.useLogo ? <Logo /> : null}
      {settings.value.useLoadingBox
        ? (
        <LoadingBox viewer={props.viewer} />
          )
        : null}
      {settings.value.useControlBar
        ? (
        <ControlBar
          viewer={viewer}
          help={help}
          side={side}
          isolation={isolation}
          cursor={cursor}
          settings={settings.value}
        />
          )
        : null}
      {settings.value.useAxesPanel ? <AxesPanel viewer={viewer} /> : null}
      <SidePanel viewer={props.viewer} side={side} content={sidePanel} />
      <ReactTooltip delayShow={200} />
      <VimContextMenu
        viewer={viewer}
        help={help}
        isolation={isolation}
        selection={selection}
      />
      <MenuToast viewer={props.viewer}></MenuToast>
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

function useViewerState (viewer: VIM.Viewer) {
  const getVim = () => viewer.selection.vim ?? viewer.vims[0]

  const [vim, setVim] = useState<VIM.Vim>(getVim())
  const [selection, setSelection] = useState<VIM.Object[]>([
    ...viewer.selection.objects
  ])

  useEffect(() => {
    // register to viewer state changes
    const subLoad = viewer.onVimLoaded.subscribe(() => setVim(getVim()))
    const subSelect = viewer.selection.onValueChanged.subscribe(() => {
      setVim(getVim())
      setSelection([...viewer.selection.objects])
    })

    // Clean up
    return () => {
      subLoad()
      subSelect()
    }
  }, [])

  return [vim, selection] as [VIM.Vim, VIM.Object[]]
}
