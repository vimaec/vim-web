/**
 * @module public-api
 */

import React, { useEffect, useRef, useState, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import ReactTooltip from 'react-tooltip'

import * as VIM from '../../core-viewers/webgl/index'
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
import { SidePanelMemo } from '../sidePanel/sidePanel'
import { useSideState } from '../sidePanel/sideState'
import { MenuSettings } from '../settings/menuSettings'
import { MenuToastMemo } from '../panels/toast'
import { Overlay } from '../panels/overlay'
import { addPerformanceCounter } from '../panels/performance'
import { ComponentInputs as ComponentInputScheme } from '../helpers/inputs'
import { CursorManager } from '../helpers/cursor'
import { PartialComponentSettings, isTrue } from '../settings/settings'
import { useSettings } from '../settings/settingsState'
import { Isolation } from '../helpers/isolation'
import { useCamera } from '../state/cameraState'
import { TreeActionRef } from '../bim/bimTree'
import { Container, createContainer } from '../container'
import { useViewerState } from './viewerState'
import { LogoMemo } from '../panels/logo'
import { VimComponentRef } from './webglComponentRef'
import { useBimInfo } from '../bim/bimInfoData'
import { whenTrue } from '../helpers/utils'
import { DeferredPromise } from '../helpers/deferredPromise'
import { ComponentLoader } from './webglLoading'
import { Modal, useModal } from '../panels/modal'
import { SectionBoxPanel } from '../panels/sectionBoxPanel'
import { useWebglSectionBox } from './webglSectionBoxState'
import { useWebglCamera } from './webglCameraState'

/**
 * Creates a UI container along with a VIM.Viewer and its associated React component.
 * @param container An optional container object. If none is provided, a container will be created.
 * @param componentSettings UI Component settings.
*  @param viewerSettings Viewer settings.
 * @returns An object containing the resulting container, reactRoot, and viewer.
 */
export function createWebglComponent (
  container?: Container | HTMLElement,
  componentSettings: PartialComponentSettings = {},
  viewerSettings: VIM.PartialViewerSettings = {}
) : Promise<VimComponentRef> {
  const promise = new DeferredPromise<VimComponentRef>()

  // Create the container
  const cmpContainer = container instanceof HTMLElement
    ? createContainer(container)
    : container ?? createContainer()

  // Create the viewer inside the container
  const viewer = new VIM.Viewer(viewerSettings)
  viewer.viewport.reparent(cmpContainer.gfx)

  // Create the React root
  const reactRoot = createRoot(cmpContainer.ui)

  // Patch the component to clean up after itself
  const patchRef = (cmp : VimComponentRef) => {
    cmp.dispose = () => {
      viewer.dispose()
      cmpContainer.dispose()
      reactRoot.unmount()
    }
    return cmp
  }

  reactRoot.render(
    <VimComponent
      container={cmpContainer}
      viewer={viewer}
      onMount = {(cmp : VimComponentRef) => promise.resolve(patchRef(cmp))}
      settings={componentSettings}
    />
  )
  return promise
}

/**
 * Represents a React component providing UI for the Vim viewer.
 * @param container The container object containing root, gfx, and UI elements for the Vim viewer.
 * @param viewer The Vim viewer instance for which UI is provided.
 * @param onMount A callback function triggered when the component is mounted. Receives a reference to the Vim component.
 * @param settings Optional settings for configuring the Vim component's behavior.
 */
export function VimComponent (props: {
  container: Container
  viewer: VIM.Viewer
  onMount: (component: VimComponentRef) => void
  settings?: PartialComponentSettings
}) {
  const settings = useSettings(props.viewer, props.settings ?? {})
  const modal = useModal(settings.value.capacity.canFollowUrl)

  const camera = useWebglCamera(props.viewer)
  const cursor = useMemo(() => new CursorManager(props.viewer), [])
  const loader = useRef(new ComponentLoader(props.viewer, modal))

  const [isolation] = useState(() => new Isolation(props.viewer, camera, settings.value))
  useEffect(() => isolation.applySettings(settings.value), [settings])

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
  
  const sectionBox = useWebglSectionBox(props.viewer)
  const controlBar = useControlBar(props.viewer, camera, modal, side, isolation, cursor, settings.value, sectionBox, controlBarCustom)

  useEffect(() => {
    side.setHasBim(viewerState.vim?.bim !== undefined)
  }, [viewerState.vim?.bim])

  // On first render
  useEffect(() => {
    if (performanceRef.current) {
      addPerformanceCounter(performanceRef.current)
    }

    cursor.register()

    // Setup custom input scheme
    props.viewer.viewport.canvas.tabIndex = 0
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
      get sectionBox(){
        return sectionBox
      },
      contextMenu: {
        customize: (v) => setcontextMenu(() => v)
      },
      controlBar: {
        customize: (v) => setControlBarCustom(() => v)
      },
      modal,
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
        isolation={isolation}
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
      <Modal state={modal} />
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
        <SectionBoxPanel state={sectionBox}/>
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
        modal={modal}
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
