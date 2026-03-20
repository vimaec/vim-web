

import * as Core from '../../core-viewers'
import { createSettings } from '../settings/settingsState'
import { disableLocalStorage } from '../settings/localStorage'
import { useRef, RefObject, useState, forwardRef, useImperativeHandle, useEffect } from 'react'
import { useSubscribe, useCustomizer } from '../helpers/reactUtils'
import { Container, createContainer } from '../container'
import { createRoot } from 'react-dom/client'
import { Overlay } from '../panels/overlay'
import { Modal, ModalApi } from '../panels/modal'
import { getRequestErrorMessage } from './errors/ultraErrors'
import { updateModal, updateProgress as modalProgress } from './modal'
import { ControlBar } from '../controlbar/controlBar'
import { useUltraSectionBox } from './sectionBox'
import { useUltraControlBar } from './controlBar'
import { SectionBoxPanel } from '../panels/sectionBoxPanel'
import { RestOfScreen } from '../panels/restOfScreen'
import { LogoMemo } from '../panels/logo'
import { whenTrue } from '../helpers/utils'
import { useSideState } from '../state/sideState'
import { UltraViewerApi } from './viewerApi'
import ReactTooltip from 'react-tooltip'
import { useUltraFraming } from './camera'
import { useViewerInput } from '../state/viewerInputs'
import { useUltraIsolation } from './isolation'
import { IsolationPanel } from '../panels/isolationPanel'
import { GenericPanelApi } from '../generic/genericPanel'
import { SettingsPanel } from '../settings/settingsPanel'
import { SidePanelMemo } from '../panels/sidePanel'
import { getDefaultUltraSettings, PartialUltraSettings, UltraSettings } from './settings'
import { getUltraSettingsContent } from './settingsPanel'
import { isTrue } from '../settings/userBoolean'


/**
 * Creates an Ultra viewer with React UI for server-side rendered models.
 * Returns an {@link UltraViewerApi} for programmatic interaction.
 *
 * @param container An optional container or DOM element. If none is provided, one will be created.
 * @param settings React UI feature toggles (panels, buttons). See {@link UltraSettings}.
 * @returns The viewer API.
 *
 * @example
 * const viewer = React.Ultra.createViewer(document.getElementById('app'))
 * await viewer.core.connect({ url: 'wss://server:8080' })
 * viewer.load({ url: 'model.vim' })
 */
export async function createUltraViewer (
  container?: Container | HTMLElement,
  settings?: PartialUltraSettings
) : Promise<UltraViewerApi> {
  const cmpContainer = container instanceof HTMLElement
    ? createContainer(container)
    : container ?? createContainer()

  const core = Core.Ultra.createViewer(cmpContainer.gfx)

  const reactRoot = createRoot(cmpContainer.ui)

  const api = await new Promise<UltraViewerApi>(resolve => {
    reactRoot.render(
      <UltraViewerComponent
        ref={(api) => { if (api) resolve(api) }}
        container={cmpContainer}
        core={core}
        settings={settings}
      />
    )
  })

  api.dispose = () => {
    core.dispose()
    cmpContainer.dispose()
    reactRoot.unmount()
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
export const UltraViewerComponent = forwardRef<UltraViewerApi, {
  container: Container
  core: Core.Ultra.Viewer
  settings?: PartialUltraSettings
}>((props, ref) => {

  const settings = createSettings(props.settings ?? {}, getDefaultUltraSettings())
  const sectionBoxRef = useUltraSectionBox(props.core, settings.sectionBox)
  const framing = useUltraFraming(props.core, sectionBoxRef, settings.camera.autoCamera)
  const isolationPanelHandle = useRef<GenericPanelApi>(null)
  const sectionBoxPanelHandle = useRef<GenericPanelApi>(null)
  const modalHandle = useRef<ModalApi>(null)

  const side = useSideState(true, 400)
  const [_, setSelectState] = useState(0)
  const isolationRef = useUltraIsolation(props.core, settings.isolation)
  const [controlBar, controlBarApi] = useCustomizer(
    useUltraControlBar(props.core, sectionBoxRef, isolationRef, framing, settings, side, modalHandle)
  )

  useViewerInput(props.core.inputs, framing)

  useEffect(() => {
    if (!settings.capacity.canReadLocalStorage) disableLocalStorage()
  }, [])

  useEffect(() => {
    if (settings.cursor?.default !== undefined) {
      props.core.inputs.pointerMode = settings.cursor.default
    }
  }, [])

  useImperativeHandle(ref, () => ({
    type: 'ultra' as const,
    container: props.container,
    core: props.core,
    get modal() { return modalHandle.current },
    isolation: isolationRef,
    sectionBox: sectionBoxRef,
    framing,
    get isolationPanel() { return isolationPanelHandle.current },
    get sectionBoxPanel() { return sectionBoxPanelHandle.current },
    dispose: () => {},
    controlBar: controlBarApi,
    load: patchLoad(props.core, modalHandle),
    unload: (vim) => props.core.unload(vim)
  }), [])

  useSubscribe(sectionBoxRef.showOffsetPanel.onChange, (show) => {
    if(show) isolationRef.showPanel.set(false)
  })
  useSubscribe(isolationRef.showPanel.onChange, (show) => {
    if(show) sectionBoxRef.showOffsetPanel.set(false)
  })
  useSubscribe(props.core.onStateChanged, state => updateModal(modalHandle, state))
  useSubscribe(props.core.selection.onSelectionChanged, () => setSelectState(i => (i+1)%2))


  const sidePanel = () => (
    <>
      <SettingsPanel
        visible={side.getContent() === 'settings'}
        content={getUltraSettingsContent(isolationRef)}
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
    {whenTrue(settings.ui.panelLogo, <LogoMemo/>)}
    <Overlay canvas={props.core.viewport.canvas}/>
    <ControlBar
      content={controlBar}
      show={isTrue(settings.ui.panelControlBar)}
    />
    <SectionBoxPanel ref={sectionBoxPanelHandle} state={sectionBoxRef}/>
    <IsolationPanel ref={isolationPanelHandle} state={isolationRef}/>
  </>
  }}/>
  
  <Modal ref={modalHandle} canFollowLinks= {true}/>
  <ReactTooltip
    multiline={true}
    arrowColor="transparent"
    type="light"
    className="vim-tooltip"
    delayShow={200}
  />
  </>
})

function patchLoad(viewer: Core.Ultra.Viewer, modal: RefObject<ModalApi>) {
  return function load (source: Core.Ultra.VimSource): Core.Ultra.IUltraLoadRequest {
    const request = viewer.load(source)

    // We don't want to block the main thread to get progress updates
    void modalProgress(request, modal.current)

    // We decorate the request to display manage modal messages
    void request.getResult().then(
      result => {
        if (result.isError) {
          modal.current?.message(getRequestErrorMessage(viewer.serverUrl, source, result.type))
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


