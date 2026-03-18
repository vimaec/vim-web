/**
 * @module public-api
 */

import { useEffect, useRef, useMemo, forwardRef, useImperativeHandle } from 'react'
import { useSubscribe, useCustomizer } from '../helpers/reactUtils'
import { createRoot } from 'react-dom/client'

import ReactTooltip from 'react-tooltip'

import * as Core from '../../core-viewers'
import { AxesPanelMemo } from '../panels/axesPanel'
import { ControlBar } from '../controlbar/controlBar'
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
import { MenuToastMemo } from '../panels/toast'
import { Overlay } from '../panels/overlay'
import { addPerformanceCounter } from '../panels/performance'
import { applyWebglBindings } from './inputsBindings'
import { CursorManager } from '../helpers/cursor'
import { useSettings } from '../settings/settingsState'
import { TreeActionApi } from '../bim/bimTree'
import { Container, createContainer } from '../container'
import { useViewerState } from './viewerState'
import { LogoMemo } from '../panels/logo'
import { WebglViewerApi } from './viewerApi'
import { useBimInfo } from '../bim/bimInfoData'
import { whenTrue } from '../helpers/utils'
import { ComponentLoader } from './loading'
import { Modal, ModalApi } from '../panels/modal'
import { SectionBoxPanel } from '../panels/sectionBoxPanel'
import { useWebglSectionBox } from './sectionBox'
import { useWebglFraming } from './camera'
import { useViewerInput } from '../state/viewerInputs'
import { IsolationPanel } from '../panels/isolationPanel'
import { useWebglIsolation } from './isolation'
import { GenericPanelApi } from '../generic/genericPanel'
import { SettingsCustomization } from '../settings/settingsItem'
import { getDefaultSettings, PartialWebglSettings, WebglSettings } from './settings'
import { isTrue } from '../settings/userBoolean'
import { SettingsPanel } from '../settings/settingsPanel'
import { applyWebglSettings, getWebglSettingsContent } from './settingsPanel'

/**
 * Creates a WebGL viewer with full React UI (BIM tree, context menu, control bar, etc.).
 * Returns a {@link WebglViewerApi} for programmatic interaction.
 *
 * @param container An optional container or DOM element. If none is provided, one will be created.
 * @param settings React UI feature toggles (panels, buttons). See {@link WebglSettings}.
 * @param coreSettings Core renderer config (camera, materials, lighting). See {@link ViewerSettings}.
 * @returns The viewer API.
 *
 * @example
 * const viewer = React.Webgl.createViewer(document.getElementById('app'))
 * const vim = await viewer.load({ url: 'model.vim' }).getVim()
 * viewer.framing.frameScene.call()
 */
export async function createWebglViewer (
  container?: Container | HTMLElement,
  settings: PartialWebglSettings = {},
  coreSettings: Core.Webgl.PartialViewerSettings = {}
) : Promise<WebglViewerApi> {
  const cmpContainer = container instanceof HTMLElement
    ? createContainer(container)
    : container ?? createContainer()

  const viewer = Core.Webgl.createViewer(coreSettings)
  viewer.viewport.reparent(cmpContainer.gfx)

  const reactRoot = createRoot(cmpContainer.ui)

  const api = await new Promise<WebglViewerApi>(resolve => {
    reactRoot.render(
      <WebglViewerComponent
        ref={(api) => { if (api) resolve(api) }}
        container={cmpContainer}
        viewer={viewer}
        settings={settings}
      />
    )
  })

  api.dispose = () => {
    viewer.dispose()
    cmpContainer.dispose()
    queueMicrotask(() => reactRoot.unmount())
  }
  return api
}

/**
 * Represents a React viewer providing UI for the Vim viewer.
 * @param container The container object containing root, gfx, and UI elements for the Vim viewer.
 * @param viewer The Vim viewer instance for which UI is provided.
 * @param onMount A callback function triggered when the viewer is mounted. Receives a reference to the Vim viewer.
 * @param settings Optional settings for configuring the Vim viewer's behavior.
 */
export const WebglViewerComponent = forwardRef<WebglViewerApi, {
  container: Container
  viewer: Core.Webgl.Viewer
  settings?: PartialWebglSettings
}>((props, ref) => {
  const settings = useSettings(props.settings ?? {}, getDefaultSettings(), (s) => applyWebglSettings(s))
  const modal = useRef<ModalApi>(null)

  const sectionBoxRef = useWebglSectionBox(props.viewer)
  const isolationPanelHandle = useRef<GenericPanelApi>(null)
  const sectionBoxPanelHandle = useRef<GenericPanelApi>(null)

  const framing = useWebglFraming(props.viewer, sectionBoxRef)
  const cursor = useMemo(() => new CursorManager(props.viewer), [])
  const loader = useRef(new ComponentLoader(props.viewer, modal, settings.value))
  useViewerInput(props.viewer.inputs, framing)

  const side = useSideState(
    isTrue(settings.value.ui.panelBimTree) ||
    isTrue(settings.value.ui.panelBimInfo),
    Math.min(props.container.root.clientWidth * 0.25, 340)
  )
  const contextMenuFn = useRef<ContextMenuCustomization>()
  const bimInfoRef = useBimInfo()

  const viewerState = useViewerState(props.viewer)
  const treeRef = useRef<TreeActionApi>()
  const performanceRef = useRef<HTMLDivElement>(null)
  const isolationRef = useWebglIsolation(props.viewer)
  const [controlBar, setControlBarCustom] = useCustomizer(
    useControlBar(props.viewer, framing, modal.current, side, cursor, settings.value, sectionBoxRef, isolationRef)
  )

  useEffect(() => {
    side.setHasBim(viewerState.vim.get()?.bim !== undefined)
  })

  useImperativeHandle(ref, () => ({
    type: 'webgl' as const,
    container: props.container,
    core: props.viewer,
    load: (source, loadSettings) => loader.current.load(source, loadSettings),
    open: (source, loadSettings) => loader.current.open(source, loadSettings),
    unload: (vim) => props.viewer.unload(vim),
    isolation: isolationRef,
    framing,
    settings: {
      update: settings.update,
      register: settings.register,
      customize: (c: SettingsCustomization<WebglSettings>) => settings.customizer.set(c)
    },
    isolationPanel: isolationPanelHandle.current,
    sectionBoxPanel: sectionBoxPanelHandle.current,
    sectionBox: sectionBoxRef,
    contextMenu: {
      customize: (v) => { contextMenuFn.current = v }
    },
    controlBar: {
      customize: (v) => setControlBarCustom(v)
    },
    modal: modal.current,
    bimInfo: bimInfoRef,
    dispose: () => {}
  }), [])

  useSubscribe(sectionBoxRef.showOffsetPanel.onChange, (show) => {
    if(show) isolationRef.showPanel.set(false)
  })
  useSubscribe(isolationRef.showPanel.onChange, (show) => {
    if(show) sectionBoxRef.showOffsetPanel.set(false)
  })

  useSubscribe(props.viewer.inputs.onContextMenu, showContextMenu)

  // On first render
  useEffect(() => {
    if (performanceRef.current) {
      addPerformanceCounter(performanceRef.current)
    }

    cursor.register()

    // Setup custom input scheme
    props.viewer.viewport.canvas.tabIndex = 0
    applyWebglBindings(props.viewer, framing, isolationRef, side)

    return () => cursor.unregister()
  }, [])

  const sidePanel = () => (
    <>
      {<OptionalBimPanel
        viewer={props.viewer}
        framing={framing}
        viewerState={viewerState}
        visible={side.getContent() === 'bim'}
        isolation={isolationRef}
        treeRef={treeRef}
        settings={settings.value}
        bimInfoRef={bimInfoRef}
      />}
      <SettingsPanel
        visible={side.getContent() === 'settings'}
        content={getWebglSettingsContent(props.viewer)}
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
        {whenTrue(settings.value.ui.panelLogo, <LogoMemo/>)}
        <ControlBar
          content={controlBar}
          show={isTrue(settings.value.ui.panelControlBar)}
        />
        <SectionBoxPanel ref={sectionBoxPanelHandle} state={sectionBoxRef}/>
        <IsolationPanel ref={isolationPanelHandle} state={isolationRef}/>
        <AxesPanelMemo
          viewer={props.viewer}
          framing={framing}
          settings={settings}
        />
      </>
      }}/>

      <VimContextMenuMemo
        viewer={props.viewer}
        framing={framing}
        modal={modal.current}
        isolation={isolationRef}
        selection={viewerState.selection.get()}
        customization={contextMenuFn.current}
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
})
