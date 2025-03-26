

import * as Ultra from '../../core-viewers/ultra/index'
import React, { useEffect, useState } from 'react'
import { Container, createContainer } from '../container'
import { createRoot } from 'react-dom/client'
import { DeferredPromise } from '../helpers/deferredPromise'
import { Overlay } from '../panels/overlay'
import { Modal, ModalRef, useModal } from '../panels/modal'
import { getRequestErrorMessage } from './errors/ultraErrors'
import { updateModal, updateProgress as modalProgress } from './ultraModal'
import { ControlBar, ControlBarCustomization } from '../controlbar/controlBar'
import { useUltraSectionBox } from './ultraSectionBoxState'
import { useUltraControlBar } from './ultraControlBarState'
import { SectionBoxPanel } from '../panels/sectionBoxPanel'
import { RestOfScreen } from '../panels/restOfScreen'
import { LogoMemo } from '../panels/logo'
import { whenTrue } from '../helpers/utils'
import { useSideState } from '../sidePanel/sideState'
import { UltraComponentRef } from './ultraComponentRef'
import ReactTooltip from 'react-tooltip'
import { useUltraCamera } from './ultraCameraState'
import { useViewerInput } from '../state/viewerInputs'

/**
 * Creates a UI container along with a VIM.Viewer and its associated React component.
 * @param container An optional container object. If none is provided, a container will be created.
 * @param componentSettings UI Component settings.
*  @param viewerSettings Viewer settings.
 * @returns An object containing the resulting container, reactRoot, and viewer.
 */
export function createUltraComponent (
  container?: Container | HTMLElement
) : Promise<UltraComponentRef> {
  const promise = new DeferredPromise<UltraComponentRef>()
  const cmpContainer = container instanceof HTMLElement
    ? createContainer(container)
    : container ?? createContainer()

  // Create the viewer and container
  const viewer = Ultra.UltraCoreViewer.createWithCanvas(cmpContainer.gfx)

  // Create the React root
  const reactRoot = createRoot(cmpContainer.ui)

  // Patch the component to clean up after itself
  const attachDispose = (cmp : UltraComponentRef) => {
    cmp.dispose = () => {
      viewer.dispose()
      cmpContainer.dispose()
      reactRoot.unmount()
    }
    return cmp
  }

  reactRoot.render(
    <UltraComponent
      container={cmpContainer}
      viewer={viewer}
      onMount = {(cmp : UltraComponentRef) => promise.resolve(attachDispose(cmp))}
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
export function UltraComponent (props: {
  container: Container
  viewer: Ultra.UltraCoreViewer
  onMount: (component: UltraComponentRef) => void}) {

  const modal = useModal(true)
  const sectionBox = useUltraSectionBox(props.viewer)
  const camera = useUltraCamera(props.viewer, sectionBox)

  const side = useSideState(true, 400)
  const [_, setSelectState] = useState(0)
  const [controlBarCustom, setControlBarCustom] = useState<ControlBarCustomization>(() => c => c)
  const controlBar = useUltraControlBar(props.viewer, sectionBox, camera, _ =>_)
  useViewerInput(props.viewer.inputs, camera)

  useEffect(() => {
    props.viewer.onStateChanged.subscribe(state => updateModal(modal, state))
    props.viewer.selection.onValueChanged.subscribe(() =>{
      setSelectState(i => (i+1)%2)
    } )
    props.onMount({
      viewer: props.viewer,
      modal,
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
  </>
  }}/>
  
  <Modal state={modal}/>
  <ReactTooltip
    multiline={true}
    arrowColor="transparent"
    type="light"
    className="!vc-max-w-xs !vc-border !vc-border-solid !vc-border-gray-medium !vc-bg-white !vc-text-xs !vc-text-gray-darkest !vc-opacity-100 !vc-shadow-[2px_6px_15px_rgba(0,0,0,0.3)] !vc-transition-opacity"
    delayShow={200}
  />
  </>
}

function patchLoad(viewer: Ultra.UltraCoreViewer, modal: ModalRef) {
  return function load (source: Ultra.VimSource): Ultra.ILoadRequest {
    const request = viewer.loadVim(source)

    // We don't want to block the main thread to get progress updates
    void modalProgress(request, modal)

    // We decorate the request to display manage modal messages
    void request.getResult().then(
      result => {
        if (result.isError) {
          modal.message(getRequestErrorMessage(viewer.serverUrl, source, result.error))
          return
        }
        if (result.isSuccess) {
          modal.loading(undefined)
        }
      }
    )
    return request
  }
}


