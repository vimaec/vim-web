/**
 * @module viw-webgl-component
 */

import React, { useEffect, useRef, useState } from 'react'
import * as Icons from './icons'
import { ComponentCamera } from '../helpers/camera'
import { anyUiAxesButton, isTrue } from '../settings/settings'
import { SettingsState } from '../settings/settingsState'
import { VIM } from '../component'
import { whenAllTrue, whenTrue } from '../helpers/utils'

/**
 * Memoized version of the AxesPanelMemo.
 */
export const AxesPanelMemo = React.memo(AxesPanel)

/**
 * JSX Component for axes gizmo.
 */
function AxesPanel (props: { viewer: VIM.Viewer, camera: ComponentCamera, settings: SettingsState }) {
  const viewer = props.viewer

  const [ortho, setOrtho] = useState<boolean>(viewer.camera.orthographic)

  const gizmoDiv = useRef<HTMLDivElement>()
  const resize = useRef<ResizeObserver>()

  useEffect(() => {
    resize.current = new ResizeObserver(() => {
      viewer.gizmos.axes.resize(gizmoDiv.current.clientWidth)
      // Remove default styling of the axes
      viewer.gizmos.axes.canvas.style.top = '0px'
      viewer.gizmos.axes.canvas.style.right = '0px'
    })
    resize.current.observe(gizmoDiv.current)

    const subCam = viewer.camera.onSettingsChanged.subscribe(() =>
      setOrtho(viewer.camera.orthographic)
    )

    if (viewer.gizmos.axes.canvas) {
      gizmoDiv.current.appendChild(viewer.gizmos.axes.canvas)
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

  const onIsolationBtn = () => {
    props.settings.update(
      (s) => (s.isolation.useIsolationMaterial = !s.isolation.useIsolationMaterial)
    )
  }

  const onHomeBtn = () => {
    props.camera.reset()
  }

  const btnStyle =
    'vim-axes-button vc-flex vc-items-center vc-justify-center vc-text-gray-medium vc-transition-all hover:vc-text-primary-royal'

  const btnIsolation = (
    <button
      data-tip={
        props.settings.value.isolation.useIsolationMaterial
          ? 'Disable Ghosting'
          : 'Enable Ghosting'
      }
      onClick={onIsolationBtn}
      className={'vim-isolation-btn ' + btnStyle}
      type="button"
    >
      {props.settings.value.isolation.useIsolationMaterial
        ? (
        <Icons.ghost height={20} width={20} fill="currentColor" />
          )
        : (
        <Icons.ghostDead height={20} width={20} fill="currentColor" />
          )}
    </button>
  )

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

  const createBar = () => {
    if (!anyUiAxesButton(props.settings.value)) {
      return (
        // Keeps layout when all buttons are disabled.
        <span className="vc-pointer-events-auto vc-absolute vc-inset-0 vc-order-2 vc-flex justify-evenly vc-bg-white" />
      )
    }
    return (
      <div className="vim-axes-panel-buttons vc-absolute vc-inset-0 vc-pointer-events-auto vc-order-2 vc-flex vc-items-center vc-justify-evenly vc-bg-white">
        {whenAllTrue([
          props.settings.value.capacity.useOrthographicCamera,
          props.settings.value.ui.orthographic
        ], btnOrtho)}
        {whenTrue(props.settings.value.ui.resetCamera, btnHome)}
        {whenTrue(props.settings.value.ui.enableGhost, btnIsolation)}
      </div>
    )
  }

  return (
    <div
      className={
        'vim-axes-panel vc-pointer-events-none vc-absolute vc-overflow-hidden vc-z-20 vc-flex vc-flex-col vc-border vc-border-white vc-opacity-50 vc-shadow-lg vc-saturate-0 vc-transition-all hover:vc-opacity-100 hover:vc-saturate-100' +
        hidden
      }
    >
      <div ref={gizmoDiv} className='vim-axes-panel-gizmo vc-absolute vc-pointer-events-auto'/>
      <div className='vim-axes-panel-bar vc-absolute vc-top-[75%] vc-bottom-0 vc-right-0 vc-left-0'>
        {createBar()}
      </div>
    </div>
  )
}
