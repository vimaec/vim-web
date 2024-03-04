/**
 * @module viw-webgl-component
 */

import React, { useEffect, useRef, useState, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import ReactTooltip from 'react-tooltip'
import './style.css'
import 'vim-webgl-viewer/dist/style.css'

import * as VIM from 'vim-webgl-viewer/'
import { AxesPanelMemo } from './panels/axesPanel'
import { ControlBar } from './panels/controlBar'
import { LoadingBoxMemo, MsgInfo, ComponentWrapper } from './panels/loading'
import { OptionalBimPanel } from './bim/bimPanel'
import {
  contextMenuCustomization,
  showContextMenu,
  VimContextMenuMemo
} from './panels/contextMenu'
import { MenuHelpMemo, useHelp } from './panels/help'
import { SidePanelMemo } from './sidePanel/sidePanel'
import { useSideState } from './sidePanel/sideState'
import { MenuSettings } from './settings/menuSettings'
import { MenuToastMemo } from './panels/toast'
import { Overlay } from './panels/overlay'
import { addPerformanceCounter} from './performance'
import { ComponentInputs as ComponentInputScheme } from './helpers/inputs'
import { CursorManager } from './helpers/cursor'
import { PartialSettings, useSettings } from './settings/settings'
import { Isolation } from './helpers/isolation'
import { ComponentCamera } from './helpers/camera'
import { TreeActionRef } from './bim/bimTree'
import { VimComponentContainer, createContainer } from './container'
import { useViewerState} from './viewerState'
import  {LogoMemo} from './panels/logo'
import { VimComponentRef } from './vimComponentRef'

export * as VIM from 'vim-webgl-viewer/'
export * as ContextMenu from './panels/contextMenu'
export { getLocalSettings } from './settings/settings'
export * from './vimComponentRef'

/**
 * Creates a UI container along with a VIM.Viewer and its associated React component.
 * @param onMount A callback function triggered when the component is ready. The returned ref is the main way to interact with the component.
 * @param container An optional container object. If none is provided, a container will be created.
 * @param settings Component settings.
 * @returns An object containing the resulting container, reactRoot, and viewer.
 */
export function createVimComponent (
  onMount: (component: VimComponentRef) => void,
  container?: VimComponentContainer,
  settings: PartialSettings = {}
) {
  const viewer = new VIM.Viewer()
  container = container ?? createContainer(viewer)
  const reactRoot = createRoot(container.ui)
  reactRoot.render(
    <VimComponent
      container={{ root: container.root, gfx: container.gfx, ui: container.ui }}
      onMount={onMount}
      viewer={viewer}
      settings={settings}
    />
  )
  return { container, reactRoot, viewer }
}

/**
 * Represents a React component providing UI for the Vim viewer.
 * @param container The container object containing root, gfx, and UI elements for the Vim viewer.
 * @param viewer The Vim viewer instance for which UI is provided.
 * @param onMount A callback function triggered when the component is mounted. Receives a reference to the Vim component.
 * @param settings Optional settings for configuring the Vim component's behavior.
 */
export function VimComponent (props: {
  container: VimComponentContainer
  viewer: VIM.Viewer
  onMount: (component: VimComponentRef) => void
  settings?: PartialSettings
}) {
  const camera = useMemo(() => new ComponentCamera(props.viewer), [])
  const cursor = useMemo(() => new CursorManager(props.viewer), [])
  const loader = useRef(new ComponentWrapper())
  const settings = useSettings(props.viewer, props.settings)

  const [isolation] = useState(() => new Isolation(props.viewer, camera, settings.value))
  useEffect(() => isolation.applySettings(settings.value), [settings])

  const side = useSideState(
    settings.value.ui.bimTreePanel === true ||
      settings.value.ui.bimInfoPanel === true,
    480
  )
  const [contextMenu, setcontextMenu] = useState<contextMenuCustomization>()
  const help = useHelp()
  const viewerState = useViewerState(props.viewer)
  const [msg, setMsg] = useState<MsgInfo>()
  const treeRef = useRef<TreeActionRef>()
  const prefRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    side.setHasBim(viewerState.vim?.bim !== undefined)
  }, [viewerState.vim?.bim])

  // On first render
  useEffect(() => {
    addPerformanceCounter(prefRef.current)

    cursor.register()

    // Setup custom input scheme
    props.viewer.inputs.scheme = new ComponentInputScheme(
      props.viewer,
      camera,
      isolation,
      side
    )

    // Register context menu
    const subContext =
      props.viewer.inputs.onContextMenu.subscribe(showContextMenu)

    props.onMount({
      container: props.container,
      viewer: props.viewer,
      loader: loader.current,
      isolation,
      camera,
      settings,
      contextMenu: {
        customize: (v) => setcontextMenu(() => v)
      },
      message: {
        show: (message: string, info: string) => setMsg({ message, info }),
        hide: () => setMsg(undefined)
      }
    })

    // Clean up
    return () => {
      subContext()
      cursor.register()
    }
  }, [])

  const sidePanel = () => (
    <>
      <OptionalBimPanel
        viewer={props.viewer}
        camera={camera}
        viewerState={viewerState}
        visible={side.getContent() === 'bim'}
        isolation={isolation}
        treeRef={treeRef}
        settings={settings.value}
      />
      <MenuSettings
        visible={side.getContent() === 'settings'}
        viewer={props.viewer}
        settings={settings}
      />
    </>
  )
  return (
    <>
      <div className="vim-performance-div" ref={prefRef}></div>
      <Overlay viewer={props.viewer} side={side}></Overlay>
      <MenuHelpMemo help={help} settings={settings.value} side={side} />
      {settings.value.ui.logo === true ? <LogoMemo /> : null}
      {settings.value.ui.loadingBox === true
        ? (
        <LoadingBoxMemo loader={loader.current} content={msg} />
          )
        : null}
      <ControlBar
        viewer={props.viewer}
        camera={camera}
        help={help}
        side={side}
        isolation={isolation}
        cursor={cursor}
        settings={settings.value}
      />
      <AxesPanelMemo
        viewer={props.viewer}
        camera={camera}
        settings={settings}
      />
      <SidePanelMemo
        container={props.container}
        viewer={props.viewer}
        side={side}
        content={sidePanel}
      />

      <VimContextMenuMemo
        viewer={props.viewer}
        camera={camera}
        help={help}
        isolation={isolation}
        selection={viewerState.selection}
        customization={contextMenu}
        treeRef={treeRef}
      />
      <MenuToastMemo viewer={props.viewer} side={side}></MenuToastMemo>
      <ReactTooltip
        multiline={true}
        arrowColor="transparent"
        type="light"
        className="!vc-max-w-xs !vc-border !vc-border-solid !vc-border-gray-medium !vc-bg-white !vc-text-xs !vc-text-gray-darkest !vc-opacity-100 !vc-shadow-[2px_6px_15px_rgba(0,0,0,0.3)] !vc-transition-opacity"
        delayShow={200}
      />
    </>
  )
}