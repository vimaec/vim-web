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
import { createButton, IControlBarButtonItem, stdStyle } from './controlBarButton'
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

  const buttons : IControlBarButtonItem[] = [
    {
      enabled: () => isTrue(props.settings.ui.orbit),
      tip: 'Orbit',
      action: () => onModeBtn('orbit'),
      icon: Icons.orbit,
      isOn: () => mode === 'orbit',
      style: stdStyle
    },
    {
      enabled: () => isTrue(props.settings.ui.lookAround),
      tip: 'Look Around',
      action: () => onModeBtn('look'),
      icon: Icons.look,
      isOn: () => mode === 'look',
      style: stdStyle
    },
    {
      enabled: () => isTrue(props.settings.ui.pan),
      tip: 'Pan',
      action: () => onModeBtn('pan'),
      icon: Icons.pan,
      isOn: () => mode === 'pan',
      style: stdStyle
    },
    {
      enabled: () => isTrue(props.settings.ui.zoom),
      tip: 'Zoom',
      action: () => onModeBtn('zoom'),
      icon: Icons.zoom,
      isOn: () => mode === 'zoom',
      style: stdStyle
    },
    {
      enabled: () => isTrue(props.settings.ui.zoomWindow),
      tip: 'Zoom Window',
      action: () => {
        onModeBtn('rect')
        viewer.gizmos.section.visible = false
        viewer.gizmos.section.interactive = false
      },
      icon: Icons.frameRect,
      isOn: () => mode === 'rect',
      style: stdStyle
    },
    {
      enabled: () => isTrue(props.settings.ui.zoomToFit),
      tip: 'Zoom to Fit',
      action: () => props.camera.frameContext(),
      icon: Icons.frameSelection,
      isOn: () => false,
      style: stdStyle
    }
  ]

  return createSection('white', buttons.map(b => createButton(b)))
}
