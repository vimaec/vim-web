
import '../style.css'
import 'vim-webgl-viewer/dist/style.css'
import * as ULTRA from 'vim-ultra-viewer/'
import React, { useEffect } from 'react'
import { VimComponentContainer, createContainer } from '../container'
import { createRoot } from 'react-dom/client'
import { DeferredPromise } from '../helpers/deferredPromise'
import { Overlay } from '../panels/overlay'
import { Modal, ModalRef, useModal } from '../panels/modal'
import { getErrorMessage, getRequestErrorMessage } from './ultraErrors'
import { ClientState } from 'vim-ultra-viewer/dist/types/viewer/socketClient'
import { ILoadRequest } from 'vim-ultra-viewer/dist/types/viewer/loadRequest'
export * from 'vim-ultra-viewer/'

export type UltraComponentRef = {
  viewer : ULTRA.Viewer
  modal: ModalRef
  dispose: () => void
  load(url: string): ILoadRequest
}

/**
 * Creates a UI container along with a VIM.Viewer and its associated React component.
 * @param container An optional container object. If none is provided, a container will be created.
 * @param componentSettings UI Component settings.
*  @param viewerSettings Viewer settings.
 * @returns An object containing the resulting container, reactRoot, and viewer.
 */
export function createUltraComponent (
  container?: VimComponentContainer | HTMLElement
) : Promise<UltraComponentRef> {
  const promise = new DeferredPromise<UltraComponentRef>()
  const cmpContainer = container instanceof HTMLElement
    ? createContainer(container)
    : container ?? createContainer()
  // Create the viewer and container
  const viewer = ULTRA.Viewer.createWithCanvas(cmpContainer.gfx)

  // Create the React root
  const reactRoot = createRoot(cmpContainer.ui)

  // Patch the component to clean up after itself
  const patchRef = (cmp : UltraComponentRef) => {
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
      onMount = {(cmp : UltraComponentRef) => promise.resolve(patchRef(cmp))}
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
  container: VimComponentContainer
  viewer: ULTRA.Viewer
  onMount: (component: UltraComponentRef) => void}) {
  const modal = useModal(true)
  useEffect(() => {
    props.viewer.onStateChanged.subscribe(state => updateModal(modal, state))
    props.onMount(ToRef(props.viewer, modal))
  }, [])

  return <>
  <Overlay canvas={props.viewer.viewport.canvas}/>
  <Modal state={modal}/>
  </>
}

function updateModal (modal: ModalRef, state: ClientState) {
  if (state.status === 'connected') {
    modal.loading(undefined)
    modal.message(undefined)
  }
  if (state.status === 'connecting') {
    if (modal.current === undefined || modal.current.type === 'loading') {
      modal.loading({ message: 'Connecting to server...' })
    }
  }
  if (state.status === 'error') {
    console.log('Error loading vim', state)
    modal.message(getErrorMessage(state))
  }
}

function ToRef (viewer: ULTRA.Viewer, modal: ModalRef): UltraComponentRef {
  // Load a file from the server
  function load (url: string): ILoadRequest {
    const request = viewer.loadVim(url)

    // We don't want to block the main thread to get progress updates
    updateProgress(request, modal)

    // We decorate the request to display manage modal messages
    request.getResult().then(
      result => {
        if (result.isError) {
          modal.message(getRequestErrorMessage(url, result.error))
          return
        }
        if (result.isSuccess) {
          modal.loading(undefined)
        }
      }
    )
    return request
  }

  return {
    viewer,
    modal,
    dispose: () => {},
    load
  }
}

async function updateProgress (request: ILoadRequest, modal: ModalRef) {
  for await (const progress of request.getProgress()) {
    if (request.isCompleted) break
    modal.loading({ message: 'Loading File...', progress })
  }
}