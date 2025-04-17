/**
 * @module public-api
 */

import React, { useEffect, useRef, useState, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import ReactTooltip from 'react-tooltip'

import * as Core from '../../core-viewers'
import { AxesPanelMemo } from '../panels/axesPanel'
import { ControlBar, ControlBarCustomization } from '../controlbar/controlBar'
import { useControlBar } from '../state/controlBarState'
import { RestOfScreen } from '../panels/restOfScreen'
import { OptionalBimPanel } from '../bim/bimPanel'
import {
  ContextMenuCustomization,
  showContextMenu,
  VimContextMenuMemo
} from '../panels/contextMenu'
import { SidePanelMemo } from '../panels/sidePanel'
import { useSideState } from '../state/sideState'
import { MenuSettings } from '../settings/menuSettings'
import { MenuToastMemo } from '../panels/toast'
import { Overlay } from '../panels/overlay'
import { addPerformanceCounter } from '../panels/performance'
import { applyWebglBindings } from './inputsBindings'
import { CursorManager } from '../helpers/cursor'
import { PartialSettings, isTrue } from '../settings'
import { useSettings } from '../settings/settingsState'
import { TreeActionRef } from '../bim/bimTree'
import { Container, createContainer } from '../container'
import { useViewerState } from './viewerState'
import { LogoMemo } from '../panels/logo'
import { ViewerRef } from './viewerRef'
import { useBimInfo } from '../bim/bimInfoData'
import { whenTrue } from '../helpers/utils'
import { DeferredPromise } from '../helpers/deferredPromise'
import { ComponentLoader } from './loading'
import { Modal, ModalRef } from '../panels/modal'
import { SectionBoxPanel } from '../panels/sectionBoxPanel'
import { useWebglSectionBox } from './sectionBox'
import { useWebglCamera } from './camera'
import { useViewerInput } from '../state/viewerInputs'
import { IsolationPanel } from '../panels/isolationPanel'
import { useWebglIsolation } from './isolation'
import { GenericPanelRef } from '../panels'
import { useRefresher } from '../helpers/reactUtils'

/**
 * Creates a UI container along with a VIM.Viewer and its associated React viewer.
 * @param container An optional container object. If none is provided, a container will be created.
 * @param settings UI Component settings.
*  @param coreSettings Viewer settings.
 * @returns An object containing the resulting container, reactRoot, and viewer.
 */
export function createViewer (
  container?: Container | HTMLElement,
  settings: PartialSettings = {},
  coreSettings: Core.Webgl.PartialViewerSettings = {}
) : Promise<ViewerRef> {
  const promise = new DeferredPromise<ViewerRef>()

  // Create the container
  const cmpContainer = container instanceof HTMLElement
    ? createContainer(container)
    : container ?? createContainer()

  // Create the viewer inside the container
  const viewer = new Core.Webgl.Viewer(coreSettings)
  viewer.viewport.reparent(cmpContainer.gfx)

  // Create the React root
  const reactRoot = createRoot(cmpContainer.ui)

  // Patch the viewer to clean up after itself
  const patchRef = (cmp : ViewerRef) => {
    cmp.dispose = () => {
      viewer.dispose()
      cmpContainer.dispose()
      reactRoot.unmount()
    }
    return cmp
  }

  reactRoot.render(
    <Viewer
      container={cmpContainer}
      viewer={viewer}
      onMount = {(cmp : ViewerRef) => promise.resolve(patchRef(cmp))}
      settings={settings}
    />
  )
  return promise
}

/**
 * Represents a React viewer providing UI for the Vim viewer.
 * @param container The container object containing root, gfx, and UI elements for the Vim viewer.
 * @param viewer The Vim viewer instance for which UI is provided.
 * @param onMount A callback function triggered when the viewer is mounted. Receives a reference to the Vim viewer.
 * @param settings Optional settings for configuring the Vim viewer's behavior.
 */
export function Viewer (props: {
  container: Container
  viewer: Core.Webgl.Viewer
  onMount: (viewer: ViewerRef) => void
  settings?: PartialSettings
}) {
  const settings = useSettings(props.viewer, props.settings ?? {})
  const modal = useRef<ModalRef>(null)

  const sectionBoxRef = useWebglSectionBox(props.viewer)
  const isolationPanelRef = useRef<GenericPanelRef>(null)
  const sectionBoxPanelRef = useRef<GenericPanelRef>(null)

  const camera = useWebglCamera(props.viewer, sectionBoxRef)
  const cursor = useMemo(() => new CursorManager(props.viewer), [])
  const loader = useRef(new ComponentLoader(props.viewer, modal))
  useViewerInput(props.viewer.inputs, camera)

  const side = useSideState(
    isTrue(settings.value.ui.bimTreePanel) ||
    isTrue(settings.value.ui.bimInfoPanel),
    Math.min(props.container.root.clientWidth * 0.25, 340)
  )
  const [contextMenu, setcontextMenu] = useState<ContextMenuCustomization>()
  const [controlBarCustom, setControlBarCustom] = useState<ControlBarCustomization>()
  const bimInfoRef = useBimInfo()

  const viewerState = useViewerState(props.viewer)
  const treeRef = useRef<TreeActionRef>()
  const performanceRef = useRef<HTMLDivElement>(null)
  const isolationRef = useWebglIsolation(props.viewer)

  const controlBar = useControlBar(props.viewer, camera, modal.current, side, cursor, settings.value, sectionBoxRef, isolationRef, controlBarCustom)

  useEffect(() => {
    side.setHasBim(viewerState.vim.get()?.bim !== undefined)
  })

  // On first render
  useEffect(() => {
    if (performanceRef.current) {
      addPerformanceCounter(performanceRef.current)
    }

    cursor.register()

    // Setup custom input scheme
    props.viewer.viewport.canvas.tabIndex = 0
    applyWebglBindings(props.viewer, camera, isolationRef, side)

    // Register context menu
    const subContext =
      props.viewer.inputs.onContextMenu.subscribe(showContextMenu)

    props.onMount({
      container: props.container,
      core: props.viewer,
      loader: loader.current,
      isolation: isolationRef,
      camera,
      settings,
      get isolationPanel(){
        return isolationPanelRef.current
      },
      get sectionBoxPanel(){
        return sectionBoxPanelRef.current
      },
      get sectionBox(){
        return sectionBoxRef
      },
      contextMenu: {
        customize: (v) => setcontextMenu(() => v)
      },
      controlBar: {
        customize: (v) => setControlBarCustom(() => v)
      },
      get modal() { return modal.current },
      bimInfo: bimInfoRef,
      dispose: () => {}
    })

    // Clean up
    return () => {
      subContext()
      cursor.register()
    }
  }, [])

  const sidePanel = () => (
    <>
      {<OptionalBimPanel
        viewer={props.viewer}
        camera={camera}
        viewerState={viewerState}
        visible={side.getContent() === 'bim'}
        isolation={isolationRef}
        treeRef={treeRef}
        settings={settings.value}
        bimInfoRef={bimInfoRef}
      />}
      <MenuSettings
        visible={side.getContent() === 'settings'}
        viewer={props.viewer}
        settings={settings}
      />
    </>
  )
  return (
    <>
      <div className="vim-performance-div" ref={performanceRef}></div>
      <Modal ref={modal} canFollowLinks={settings.value.capacity.canFollowUrl} />
      <SidePanelMemo
        container={props.container}
        viewer={props.viewer}
        side={side}
        content={sidePanel}
      />
      <RestOfScreen side={side} content={() => {
        return <>
        <Overlay canvas={props.viewer.viewport.canvas}></Overlay>
        {whenTrue(settings.value.ui.logo, <LogoMemo/>)}
        <ControlBar
          content={controlBar}
          show={isTrue(settings.value.ui.controlBar)}
        />
        <SectionBoxPanel ref={sectionBoxPanelRef} state={sectionBoxRef}/>
        <IsolationPanel ref={isolationPanelRef} state={isolationRef}/>
        <AxesPanelMemo
          viewer={props.viewer}
          camera={camera}
          settings={settings}
        />
      </>
      }}/>

      <VimContextMenuMemo
        viewer={props.viewer}
        camera={camera}
        modal={modal.current}
        isolation={isolationRef}
        selection={viewerState.selection.get()}
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
