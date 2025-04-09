import React, { RefObject, useEffect, useRef } from 'react'
import * as VIM from '../../vim-web'
import * as DevUrls from '../devUrls'
globalThis.THREE = VIM.THREE

import ViewerRef = VIM.React.Webgl.ViewerRef
import Webgl = VIM.React.Webgl

/**
 * Custom hook to create a WebGL viewer and attach it to a div element.
 * @param div - The div element to attach the viewer to
 * @param onReady - Callback function to be called when the viewer is ready
 */
export function useWebglViewer (div: RefObject<HTMLDivElement>, onReady?: (viewer: ViewerRef) => void) {
  const viewerRef = useRef<ViewerRef>()
  useEffect(() => {
    Webgl.createViewer(div.current).then((viewer) => {
      viewerRef.current = viewer
      globalThis.viewer = viewer
      onReady?.(viewer)
    })

    return () => viewerRef.current?.dispose()
  }, [])
}

/**
 * Custom hook to create a WebGL viewer and load a model into it.
 * @param div - The div element to attach the viewer to 
 * @param model - The URL of the model to load
 * @param onReady - Callback function to be called when the viewer is ready and the model is loaded
 * @returns {void}
 */
export function useWebglViewerWithModel (div: RefObject<HTMLDivElement>, model: string, onReady?: (viewer: ViewerRef) => void) {
  useWebglViewer(div, async (viewer) => {
    const request = viewer.loader.request(
      { url: model }
    )
    const result = await request.getResult()
    if (result.isSuccess()) {
      viewer.loader.add(result.result)
      viewer.camera.frameScene.call()
    }
    onReady?.(viewer)
  })
}

/**
 * Custom hook to create a WebGL viewer and load the medical tower model into it.
 * @param div - The div element to attach the viewer to
 * @param onReady - Callback function to be called when the viewer is ready
 */
export function useWebglViewerWithResidence(div: RefObject<HTMLDivElement>, onReady?: (viewer: ViewerRef) => void) {
  useWebglViewerWithModel(div, DevUrls.residence, onReady)
}

/**
 * Custom hook to create a WebGL viewer and load the medical tower model into it.
 * @param div - The div element to attach the viewer to
 * @param onReady - Callback function to be called when the viewer is ready
 */
export function useWebglViewerWithTower(div: RefObject<HTMLDivElement>, onReady?: (viewer: ViewerRef) => void) {
  useWebglViewerWithModel(div, DevUrls.medicalTower, onReady)
}
