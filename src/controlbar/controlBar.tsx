/**
 * @module viw-webgl-component
 */

import React, { useEffect, useRef, useState } from 'react'
import ReactTooltip from 'react-tooltip'
import * as VIM from 'vim-webgl-viewer/'
import { ComponentCamera } from '../helpers/camera'
import { CameraObserver } from '../helpers/cameraObserver'
import { CursorManager } from '../helpers/cursor'
import { Isolation } from '../helpers/isolation'
import { HelpState } from '../panels/help'
import {
  ComponentSettings,
  anyUiCursorButton,
  anyUiSettingButton,
  anyUiToolButton
} from '../settings/settings'
import { SideState } from '../sidePanel/sideState'
import { TabCamera } from './controlBarCamera'
import { TabSettings } from './controlBarSettings'
import { TabTools } from './controlBarTools'

/**
 * JSX Component for the control bar.
 */
export function ControlBar (props: {
  viewer: VIM.Viewer
  camera: ComponentCamera
  help: HelpState
  side: SideState
  isolation: Isolation
  cursor: CursorManager
  settings: ComponentSettings
}) {
  const [, setVersion] = useState(0)
  const resizeObserver = useRef<ResizeObserver>()

  // eslint-disable-next-line no-unused-vars
  const [show, setShow] = useState(true)
  const cameraObserver = useRef<CameraObserver>()

  // On Each Render
  useEffect(() => {
    ReactTooltip.rebuild()
  })

  useEffect(() => {
    resizeObserver.current = new ResizeObserver(() => {
      setVersion((prev) => prev ^ 1)
    })
    resizeObserver.current.observe(document.body)

    cameraObserver.current = new CameraObserver(props.viewer, 400)
    cameraObserver.current.onChange = (moving) => setShow(!moving)

    return () => {
      resizeObserver.current?.disconnect()
      cameraObserver.current?.dispose()
    }
  }, [])

  return (
    <div
      style={{
        gap: 'min(10px, 1%)',
        left: props.side.getWidth(),
        width: `calc(100% - ${props.side.getWidth()}px)`,
        marginBottom: 'min(36px, 2%)'
        // For some reason this causes the ui to flicker. Disabled for now.
        // opacity: show ? 1 : 0,
      }}
      className='vim-control-bar vc-mt-2 vc-flex-wrap vc-min-w-0 vc-absolute vc-bottom-0 vc-z-20 vc-flex vc-items-center vc-justify-center vc-px-2 transition-all'>
      {anyUiCursorButton(props.settings) ? <TabCamera {...props} /> : null}
      {anyUiToolButton(props.settings) ? <TabTools {...props} /> : null}
      {anyUiSettingButton(props.settings) ? <TabSettings {...props} /> : null}
    </div>
  )
}
