/**
 * @module viw-webgl-react
 */

import React, { useEffect, useRef, useState } from 'react'
import * as Core from '../../core-viewers'
import * as Icons from '../icons'
import { CameraRef } from '../state/cameraState'
import { isTrue, Settings } from '../settings'
import { SettingsState } from '../settings/settingsState'
import { whenAllTrue, whenTrue } from '../helpers/utils'

function anyUiAxesButton (settings: Settings) {
  return (
    settings.ui.orthographic ||
    settings.ui.resetCamera
  )
}

/**
 * Memoized version of the AxesPanelMemo.
 */
export const AxesPanelMemo = React.memo(AxesPanel)

/**
 * JSX Component for axes gizmo.
 */
function AxesPanel (props: { viewer: Core.Webgl.Viewer, camera: CameraRef, settings: SettingsState }) {
  const viewer = props.viewer

  const [ortho, setOrtho] = useState<boolean>(viewer.camera.orthographic)

  const gizmoDiv = useRef<HTMLDivElement>(null)
  const resize = useRef<ResizeObserver>()

  useEffect(() => {
    const gizmo = gizmoDiv.current
    resize.current = new ResizeObserver(() => {
      viewer.gizmos.axes.resize(gizmo.clientWidth)
      // Remove default styling of the axes
      viewer.gizmos.axes.canvas.style.top = '0px'
      viewer.gizmos.axes.canvas.style.right = '0px'
    })
    resize.current.observe(gizmo)

    const subCam = viewer.camera.onSettingsChanged.subscribe(() =>
      setOrtho(viewer.camera.orthographic)
    )

    if (viewer.gizmos.axes.canvas) {
      gizmo.appendChild(viewer.gizmos.axes.canvas)
      viewer.gizmos.axes.canvas.classList.add(
        'vc-absolute',
        'vc-inset-0',
        'vc-order-1'
      )
    }

    // Clean up
    return () => {
      subCam()
      resize.current?.disconnect()
    }
  }, [])

  const onHomeBtn = () => {
    props.camera.reset.call()
  }

  const btnStyle =
    'vim-axes-button vc-flex vc-items-center vc-justify-center vc-text-gray-medium vc-transition-all hover:vc-text-primary-royal'

  const btnHome = (
    <button
      data-tip="Reset Camera"
      onClick={onHomeBtn}
      className={'vim-home-btn ' + btnStyle}
      type="button"
    >
      <Icons.home height={20} width={20} fill="currentColor" />{' '}
    </button>
  )
  const btnOrtho = (
    <button
      data-tip={ortho ? 'Orthographic' : 'Perspective'}
      onClick={() => (props.viewer.camera.orthographic = !ortho)}
      className={'vim-camera-btn ' + btnStyle}
      type="button"
    >
      {ortho
        ? (
        <Icons.orthographic height={20} width={20} fill="currentColor" />
          )
        : (
        <Icons.perspective height={20} width={20} fill="currentColor" />
          )}
    </button>
  )

  const hidden = isTrue(props.settings.value.ui.axesPanel) ? '' : ' vc-hidden'
  const empty = !anyUiAxesButton(props.settings.value)

  const createBar = () => {
    if (empty) return null
    return (
      <div className='vim-axes-panel-bar vc-absolute vc-top-[75%] vc-bottom-0 vc-right-0 vc-left-0'>
        <div className="vim-axes-panel-buttons vc-absolute vc-inset-0 vc-pointer-events-auto vc-order-2 vc-flex vc-items-center vc-justify-evenly vc-bg-white">
          {whenAllTrue([
            props.settings.value.capacity.useOrthographicCamera,
            props.settings.value.ui.orthographic
          ], btnOrtho)}
          {whenTrue(props.settings.value.ui.resetCamera, btnHome)}
        </div>
      </div>
    )
  }

  return (
    <div
      className={
        `vim-axes-panel${empty ? '-empty':''} vc-pointer-events-none vc-absolute vc-overflow-hidden vc-z-20 vc-flex vc-flex-col vc-border vc-border-white vc-opacity-50 vc-shadow-lg vc-saturate-0 vc-transition-all hover:vc-opacity-100 hover:vc-saturate-100` +
        hidden
      }
    >
      <div ref={gizmoDiv} className='vim-axes-panel-gizmo vc-absolute vc-pointer-events-auto'/>
      {createBar()}
    </div>
  )
}
