/**
 * @module viw-webgl-component
 */

import React, { useEffect, useRef, useState, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import ReactTooltip from 'react-tooltip'
import logo from './assets/logo.png'
import Stats from 'stats-js'
import './style.css'
import 'vim-webgl-viewer/dist/style.css'

import * as VIM from 'vim-webgl-viewer/'

import { AxesPanelMemo } from './axesPanel'
import { ControlBar } from './controlBar'
import { LoadingBoxMemo } from './loading'
import { BimPanel } from './bim/bimPanel'
import {
  contextMenuCustomization,
  showContextMenu,
  VimContextMenuMemo
} from './contextMenu'
import { MenuHelpMemo, useHelp } from './help'
import { SidePanelMemo } from './sidePanel/sidePanel'
import { useSideState } from './sidePanel/sideState'
import { MenuSettings } from './settings/menuSettings'
import { MenuToastMemo } from './toast'
import { Overlay } from './overlay'

import { ComponentInputs as ComponentInputScheme } from './helpers/inputs'
import { CursorManager } from './helpers/cursor'
import { PartialSettings, useSettings } from './settings/settings'
import { Isolation } from './helpers/isolation'
import { ViewerWrapper } from './helpers/viewer'

export * as VIM from 'vim-webgl-viewer/'
export * as ContextMenu from './contextMenu'

/**
 * Root level api of the vim component
 */
export type VimComponentRef = {
  /**
   * Vim webgl viewer around which the webgl component is built.
   */
  viewer: VIM.Viewer

  /**
   * Higher level helper methods built around the vim viewer.
   */
  helpers: ViewerWrapper

  /**
   * Isolation api managing isolation state in the component.
   */
  isolation: Isolation

  /**
   * Sets a message to be displayed in the loading box. Set undefined to hide.
   */
  setMsg: (s: string | undefined) => void

  /**
   * Callback to customize context menu at runtime.
   */
  customizeContextMenu: (c: contextMenuCustomization) => void

  logs: LogsRef
}

/**
 * Basic HTML structure that the webgl component expects
 */
export type VimComponentContainer = {
  /**
   * Root of the viewer, all component ui should have this as an acestor.
   */
  root: HTMLDivElement
  /**
   * Div where to instantiate ui elements.
   */
  ui: HTMLDivElement

  /**
   * Div to hold viewer canvases and ui
   */
  gfx: HTMLDivElement
}

/**
 * Creates a ui container along with a VIM.Viewer and the associated react component
 * @param onMount callback when the component is ready, the returned ref is the main way to interact with the component.
 * @param container optional container object, a container will be created if none is given.
 * @param settings component settings.
 * @returns resulting container, reactRoot and viewer.
 */
export function createVimComponent (
  onMount: (component: VimComponentRef) => void,
  container?: VimComponentContainer,
  settings: PartialSettings = {}
) {
  const viewer = new VIM.Viewer()
  container = container ?? createContainer(viewer)
  const reactRoot = createRoot(container.ui)
  const component = React.createFactory(VimComponent)
  reactRoot.render(component({ viewer, onMount, settings }))
  return { container, reactRoot, viewer }
}

/**
 * Creates a default container for the vim component around a vim viewer
 */
export function createContainer (viewer: VIM.Viewer): VimComponentContainer {
  const root = document.createElement('div')
  root.className =
    'vim-component vc-absolute vc-top-0 vc-left-0 vc-h-full vc-w-full'
  document.body.append(root)

  // container for canvases
  const gfx = document.createElement('div')
  gfx.className = 'vim-gfx vc-absolute vc-top-0 vc-left-0 vc-h-full vc-w-full'

  root.append(gfx)

  gfx.append(viewer.viewport.canvas)
  gfx.append(viewer.viewport.text)
  gfx.append(viewer.axesCanvas)

  // container for ui
  const ui = document.createElement('div')
  ui.className = 'vim-ui vc-top-0 vc-left-0 vc-h-full vc-w-full'

  root.append(ui)

  // Initial viewer settings
  viewer.viewport.canvas.tabIndex = 0
  viewer.sectionBox.clip = true

  return { root, ui, gfx }
}

/**
 * Vim Component JSX Element proving UI for the vim viewer.
 * @param viewer Vim viewer for which to provide ui.
 * @param onMount
 * @param settings
 */
export function VimComponent (props: {
  viewer: VIM.Viewer
  onMount: (component: VimComponentRef) => void
  settings?: PartialSettings
}) {
  const viewer = useRef(new ViewerWrapper(props.viewer)).current
  const cursor = useRef(new CursorManager(props.viewer)).current
  const settings = useSettings(props.viewer, props.settings)

  const [isolation] = useState(() => new Isolation(viewer, settings.value))
  useEffect(() => isolation.applySettings(settings.value), [settings])

  const side = useSideState(settings.value.ui.bimPanel, 480)
  const [contextMenu, setcontextMenu] = useState<contextMenuCustomization>()
  const help = useHelp()
  const [vim, selection] = useViewerState(props.viewer)
  const [msg, setMsg] = useState<string>()
  const [log, setLog] = useState<string>()
  const logs = useLogState()

  // On first render
  useEffect(() => {
    addPerformanceCounter()
    props.onMount({
      viewer: props.viewer,
      helpers: viewer,
      isolation,
      setMsg,
      logs,
      // Double lambda is required to avoid react from using reducer pattern
      // https://stackoverflow.com/questions/59040989/usestate-with-a-lambda-invokes-the-lambda-when-set
      customizeContextMenu: (v) => setcontextMenu(() => v)
    })
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
      {settings.value.ui.bimPanel
        ? (
        <BimPanel
          viewer={viewer}
          vim={vim}
          selection={selection}
          visible={side.getContent() === 'bim'}
          isolation={isolation}
        />
          )
        : null}
      <MenuSettings
        visible={side.getContent() === 'settings'}
        viewer={props.viewer}
        settings={settings}
      />
      {settings.value.ui.logPanel
        ? (
        <Logs visible={side.getContent() === 'logs'} text={logs.getLog()} />
          )
        : null}
    </>
  )
  return (
    <>
      <Overlay viewer={viewer.viewer} side={side}></Overlay>
      <MenuHelpMemo help={help} settings={settings.value} side={side} />
      {settings.value.ui.logo ? <LogoMemo /> : null}
      {settings.value.ui.loadingBox
        ? (
        <LoadingBoxMemo viewer={props.viewer} msg={msg} />
          )
        : null}
      {settings.value.ui.controlBar
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
      {settings.value.ui.axesPanel
        ? (
        <AxesPanelMemo viewer={viewer} settings={settings.value} />
          )
        : null}
      <SidePanelMemo viewer={props.viewer} side={side} content={sidePanel} />
      <ReactTooltip
        arrowColor="transparent"
        type="light"
        className="!vc-border !vc-border-solid !vc-border-gray-medium !vc-bg-white !vc-text-xs !vc-text-gray-darkest !vc-opacity-100 !vc-shadow-[2px_6px_15px_rgba(0,0,0,0.3)] !vc-transition-opacity"
        delayShow={200}
      />

      <VimContextMenuMemo
        viewer={viewer}
        help={help}
        isolation={isolation}
        selection={selection}
        customization={contextMenu}
      />
      <MenuToastMemo viewer={props.viewer} side={side}></MenuToastMemo>
    </>
  )
}

const LogoMemo = React.memo(() => (
  <div className={'vim-logo vc-fixed vc-top-4 vc-left-4'}>
    <a href="https://vimaec.com">
      <img className="vim-logo-img vc-h-12 vc-w-32" src={logo}></img>
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

/**
 * Adds popular performance gizmo from package stat-js
 */
function addPerformanceCounter () {
  const ui = document.getElementsByClassName('vim-ui')[0]
  const stats = new Stats()
  const div = stats.dom as HTMLDivElement
  div.className =
    'vim-performance !vc-absolute !vc-right-6 !vc-left-auto !vc-top-52 !vc-z-1'
  ui.appendChild(stats.dom)

  function animate () {
    requestAnimationFrame(() => animate())
    stats.update()
  }
  animate()
}

function Logs (props: { visible: boolean; text: string }) {
  const text = useRef<HTMLTextAreaElement>()
  const btn = useRef<HTMLButtonElement>()
  const anchor = useRef<HTMLAnchorElement>()
  const onCopyBtn = () => {
    text.current.select()
    navigator.clipboard.writeText(text.current.value)
  }

  const onSaveButton = () => {
    const blob = new Blob([text.current.value], { type: 'csv' })
    anchor.current.href = URL.createObjectURL(blob)
    anchor.current.download = 'cells'
  }

  return props.visible
    ? (
    <div className="vim-logs vc-h-full vc-w-full">
      <h2 className="vim-bim-upper-title vc-mb-6 vc-text-xs vc-font-bold vc-uppercase">
        Logs
      </h2>
      <button
        ref={btn}
        className="vim-logs-copy bg-transparent vc-absolute vc-top-4 vc-ml-12 vc-rounded vc-border vc-border-light-blue vc-py-1 vc-px-2 vc-font-semibold vc-text-light-blue hover:vc-border-transparent hover:vc-bg-light-blue hover:vc-text-white"
        onClick={onCopyBtn}
      >
        Copy
      </button>
      <button
        ref={btn}
        className="vim-logs-copy bg-transparent vc-absolute vc-top-4 vc-ml-28 vc-rounded vc-border vc-border-light-blue vc-py-1 vc-px-2 vc-font-semibold vc-text-light-blue hover:vc-border-transparent hover:vc-bg-light-blue hover:vc-text-white"
        onClick={onSaveButton}
      >
        <a ref={anchor}>Save</a>
      </button>
      <textarea
        readOnly={true}
        ref={text}
        className="vim-logs-box vc-h-full vc-w-full"
        value={props.text}
      ></textarea>
    </div>
      )
    : null
}

function useLogState () {
  const [log, setLog] = useState<string>()
  return useMemo(() => {
    return {
      log: (value: string) => {
        setLog(value)
      },
      clear: () => setLog(''),
      getLog: () => log
    } as LogsRef
  }, [log])
}

export type LogsRef = {
  log: (value: string) => void
  clear: () => void
  getLog: () => string
}
