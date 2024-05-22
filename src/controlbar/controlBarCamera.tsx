/**
 * @module viw-webgl-component
 */

import { useEffect, useState } from 'react'
import * as VIM from 'vim-webgl-viewer/'
import { ComponentCamera } from '../helpers/camera'
import * as Icons from '../panels/icons'
import {
  ComponentSettings,
  isTrue
} from '../settings/settings'
import { createButton } from './controlBarButton'
import { createSection } from './controlBarSection'

export function TabCamera (props: {viewer: VIM.Viewer, camera: ComponentCamera; settings: ComponentSettings }) {
  const viewer = props.viewer
  const [mode, setMode] = useState<VIM.PointerMode>(viewer.inputs.pointerActive)

  useEffect(() => {
    const subPointer = viewer.inputs.onPointerModeChanged.subscribe(() => {
      setMode(viewer.inputs.pointerActive)
    })

    // Clean up
    return () => {
      subPointer()
    }
  }, [])

  const onModeBtn = (target: VIM.PointerMode) => {
    const next = mode === target ? viewer.inputs.pointerFallback : target
    viewer.inputs.pointerActive = next
    setMode(next)
  }

  const btnOrbit = createButton(
    () => isTrue(props.settings.ui.orbit),
    'Orbit',
    () => onModeBtn('orbit'),
    Icons.orbit,
    () => mode === 'orbit'
  )
  const btnLook = createButton(
    () => isTrue(props.settings.ui.lookAround),
    'Look Around',
    () => onModeBtn('look'),
    Icons.look,
    () => mode === 'look'
  )
  const btnPan = createButton(
    () => isTrue(props.settings.ui.pan),
    'Pan',
    () => onModeBtn('pan'),
    Icons.pan,
    () => mode === 'pan'
  )
  const btnZoom = createButton(
    () => isTrue(props.settings.ui.zoom),
    'Zoom',
    () => onModeBtn('zoom'),
    Icons.zoom,
    () => mode === 'zoom'
  )
  const btnFrameRect = createButton(
    () => isTrue(props.settings.ui.zoomWindow),
    'Zoom Window',
    () => {
      onModeBtn('rect')
      viewer.gizmos.section.visible = false
      viewer.gizmos.section.interactive = false
    },
    Icons.frameRect,
    () => mode === 'rect'
  )
  const btnFrame = createButton(
    () => isTrue(props.settings.ui.zoomToFit),
    'Zoom to Fit',
    () => props.camera.frameContext(),
    Icons.frameSelection,
    () => false
  )

  return createSection('white', [btnOrbit, btnLook, btnPan, btnZoom, btnFrameRect, btnFrame])
}
