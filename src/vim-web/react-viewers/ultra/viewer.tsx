

import * as Core from '../../core-viewers'
import { useSettings } from '../../react-viewers/settings/settingsState'
import {useRef, RefObject, useEffect, useState } from 'react'
import { Container, createContainer } from '../container'
import { createRoot } from 'react-dom/client'
import { Overlay } from '../panels/overlay'
import { Modal, ModalHandle } from '../panels/modal'
import { getRequestErrorMessage } from './errors/ultraErrors'
import { updateModal, updateProgress as modalProgress } from './modal'
import { ControlBar, ControlBarCustomization } from '../controlbar/controlBar'
import { useUltraSectionBox } from './sectionBox'
import { useUltraControlBar } from './controlBar'
import { SectionBoxPanel } from '../panels/sectionBoxPanel'
import { RestOfScreen } from '../panels/restOfScreen'
import { LogoMemo } from '../panels/logo'
import { whenTrue } from '../helpers/utils'
import { useSideState } from '../state/sideState'
import { ViewerRef } from './viewerRef'
import ReactTooltip from 'react-tooltip'
import { useUltraCamera } from './camera'
import { useViewerInput } from '../state/viewerInputs'
import { useUltraIsolation } from './isolation'
import { IsolationPanel } from '../panels/isolationPanel'
import { GenericPanelHandle } from '../generic/genericPanel'
import { ControllablePromise } from '../../utils'
import { SettingsPanel } from '../settings/settingsPanel'
import { SidePanelMemo } from '../panels/sidePanel'
import { getDefaultUltraSettings, PartialUltraSettings, UltraSettings } from './settings'
import { getUltraSettingsContent } from './settingsPanel'
import { SettingsCustomizer } from '../settings/settingsItem'
import { isTrue } from '../settings/userBoolean'


/**
 * Creates a UI container along with a VIM.Viewer and its associated React viewer.
 * @param container An optional container object. If none is provided, a container will be created.
 * @returns An object containing the resulting container, reactRoot, and viewer.
 */
export function createViewer (
  container?: Container | HTMLElement,
  settings?: PartialUltraSettings 
) : Promise<ViewerRef> {
  
  const controllablePromise = new ControllablePromise<ViewerRef>()
  const cmpContainer = container instanceof HTMLElement
    ? createContainer(container)
    : container ?? createContainer()

  // Create the viewer and container
  const core = Core.Ultra.Viewer.createWithCanvas(cmpContainer.gfx)

  // Create the React root
  const reactRoot = createRoot(cmpContainer.ui)

  // Patch the viewer to clean up after itself
  const attachDispose = (cmp : ViewerRef) => {
    cmp.dispose = () => {
      core.dispose()
      cmpContainer.dispose()
      reactRoot.unmount()
    }
    return cmp
  }

  reactRoot.render(
    <Viewer
      container={cmpContainer}
      core={core}
      settings={settings}
      onMount = {(cmp : ViewerRef) => controllablePromise.resolve(attachDispose(cmp))}
    />
  )
  return controllablePromise.promise
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
  core: Core.Ultra.Viewer
  settings?: PartialUltraSettings
  onMount: (viewer: ViewerRef) => void}) {

  const settings = useSettings(props.settings ?? {}, getDefaultUltraSettings())
  const sectionBoxRef = useUltraSectionBox(props.core)
  const camera = useUltraCamera(props.core, sectionBoxRef)
  const isolationPanelHandle = useRef<GenericPanelHandle>(null)
  const sectionBoxPanelHandle = useRef<GenericPanelHandle>(null)
  const modalHandle = useRef<ModalHandle>(null)

  const side = useSideState(true, 400)
  const [_, setSelectState] = useState(0)
  const [controlBarCustom, setControlBarCustom] = useState<ControlBarCustomization>(() => c => c)
  const isolationRef = useUltraIsolation(props.core)
  const controlBar = useUltraControlBar(
    props.core,
    sectionBoxRef,
    isolationRef,
    camera,
    settings.value,
    side,
    modalHandle.current,
    _ =>_
  )
  
  useViewerInput(props.core.inputs, camera)

  // On First render
  useEffect(() => {
    // Close isolation panel when offset panel is shown and vice versa
    sectionBoxRef.showOffsetPanel.onChange.subscribe((show) => {
      if(show) {
        isolationRef.showPanel.set(false)
      }
    })
    isolationRef.showPanel.onChange.subscribe((show) => {
      if(show) {
        sectionBoxRef.showOffsetPanel.set(false)
      }
    })

    props.core.onStateChanged.subscribe(state => updateModal(modalHandle, state))
    props.core.selection.onSelectionChanged.subscribe(() =>{
      setSelectState(i => (i+1)%2)
    } )
    props.onMount({
      core: props.core,
      get modal() { return modalHandle.current },
      isolation: isolationRef,
      sectionBox: sectionBoxRef,
      camera,
      settings: {
        update : settings.update,
        register : settings.register,
        customize : (c: SettingsCustomizer<UltraSettings>) => settings.customizer.set(c)
      },
      get isolationPanel(){
        return isolationPanelHandle.current
      },
      get sectionBoxPanel(){
        return sectionBoxPanelHandle.current
      },
      dispose: () => {},
      controlBar: {
        customize: (v) => setControlBarCustom(() => v)
      },
      load: patchLoad(props.core, modalHandle)
    })
  }, [])

  const sidePanel = () => (
    <>
      <SettingsPanel
        visible={side.getContent() === 'settings'}
        content={getUltraSettingsContent(props.core)}
        settings={settings}
      />
    </>
  )

  return <>
  <SidePanelMemo
    container={props.container}
    viewer={props.core}
    side={side}
    content={sidePanel}
  />
  <RestOfScreen side={side} content={() => {
    return <>
    {whenTrue(settings.value.ui.panelLogo, <LogoMemo/>)}
    <Overlay canvas={props.core.viewport.canvas}/>
    <ControlBar
      content={controlBarCustom(controlBar)}
      show={isTrue(settings.value.ui.panelControlBar)}
    />
    <SectionBoxPanel ref={sectionBoxPanelHandle} state={sectionBoxRef}/>
    <IsolationPanel ref={isolationPanelHandle} state={isolationRef} transparency={false}/>
  </>
  }}/>
  
  <Modal ref={modalHandle} canFollowLinks= {true}/>
  <ReactTooltip
    multiline={true}
    arrowColor="transparent"
    type="light"
    className="!vc-max-w-xs !vc-border !vc-border-solid !vc-border-gray-medium !vc-bg-white !vc-text-xs !vc-text-gray-darkest !vc-opacity-100 !vc-shadow-[2px_6px_15px_rgba(0,0,0,0.3)] !vc-transition-opacity"
    delayShow={200}
  />
  </>
}

function patchLoad(viewer: Core.Ultra.Viewer, modal: RefObject<ModalHandle>) {
  return function load (source: Core.Ultra.VimSource): Core.Ultra.ILoadRequest {
    const request = viewer.loadVim(source)

    // We don't want to block the main thread to get progress updates
    void modalProgress(request, modal.current)

    // We decorate the request to display manage modal messages
    void request.getResult().then(
      result => {
        if (result.isError) {
          modal.current?.message(getRequestErrorMessage(viewer.serverUrl, source, result.error))
          return
        }
        if (result.isSuccess) {
          modal.current?.loading(undefined)
        }
      }
    )
    return request
  }
}


