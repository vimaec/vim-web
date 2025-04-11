

import * as Core from '../../core-viewers' 
import React, {useRef, RefObject, useEffect, useState } from 'react'
import { Container, createContainer } from '../container'
import { createRoot } from 'react-dom/client'
import { DeferredPromise } from '../helpers/deferredPromise'
import { Overlay } from '../panels/overlay'
import { Modal, ModalRef } from '../panels/modal'
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
import { IsolationSettingsPanel } from '../panels/renderSettingsPanel'

/**
 * Creates a UI container along with a VIM.Viewer and its associated React viewer.
 * @param container An optional container object. If none is provided, a container will be created.
 * @returns An object containing the resulting container, reactRoot, and viewer.
 */
export function createViewer (
  container?: Container | HTMLElement
) : Promise<ViewerRef> {
  const promise = new DeferredPromise<ViewerRef>()
  const cmpContainer = container instanceof HTMLElement
    ? createContainer(container)
    : container ?? createContainer()

  // Create the viewer and container
  const viewer = Core.Ultra.Viewer.createWithCanvas(cmpContainer.gfx)

  // Create the React root
  const reactRoot = createRoot(cmpContainer.ui)

  // Patch the viewer to clean up after itself
  const attachDispose = (cmp : ViewerRef) => {
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
      onMount = {(cmp : ViewerRef) => promise.resolve(attachDispose(cmp))}
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
  viewer: Core.Ultra.Viewer
  onMount: (viewer: ViewerRef) => void}) {

  const modal = useRef<ModalRef>(null)
  const sectionBox = useUltraSectionBox(props.viewer)
  const camera = useUltraCamera(props.viewer, sectionBox)

  const side = useSideState(true, 400)
  const [_, setSelectState] = useState(0)
  const [controlBarCustom, setControlBarCustom] = useState<ControlBarCustomization>(() => c => c)
  const isolation = useUltraIsolation(props.viewer)
  const controlBar = useUltraControlBar(props.viewer, sectionBox, isolation, camera, _ =>_)
  
  useViewerInput(props.viewer.inputs, camera)

  useEffect(() => {
    props.viewer.onStateChanged.subscribe(state => updateModal(modal, state))
    props.viewer.selection.onSelectionChanged.subscribe(() =>{
      setSelectState(i => (i+1)%2)
    } )
    props.onMount({
      viewer: props.viewer,
      get modal() { return modal.current },
      isolation,
      sectionBox,
      camera,
      dispose: () => {},
      controlBar: {
        customize: (v) => setControlBarCustom(() => v)
      },
      load: patchLoad(props.viewer, modal)
    })
  }, [])

  return <>
  <RestOfScreen side={side} content={() => {
    return <>
    {whenTrue(true, <LogoMemo/>)}
    <Overlay canvas={props.viewer.viewport.canvas}/>
    <ControlBar
      content={controlBarCustom(controlBar)}
      show={true}
    />
    <SectionBoxPanel state={sectionBox}/>
    <IsolationSettingsPanel state={isolation} />
  </>
  }}/>
  
  <Modal ref={modal} canFollowLinks= {true}/>
  <ReactTooltip
    multiline={true}
    arrowColor="transparent"
    type="light"
    className="!vc-max-w-xs !vc-border !vc-border-solid !vc-border-gray-medium !vc-bg-white !vc-text-xs !vc-text-gray-darkest !vc-opacity-100 !vc-shadow-[2px_6px_15px_rgba(0,0,0,0.3)] !vc-transition-opacity"
    delayShow={200}
  />
  </>
}

function patchLoad(viewer: Core.Ultra.Viewer, modal: RefObject<ModalRef>) {
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


