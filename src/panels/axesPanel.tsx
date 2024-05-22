/**
 * @module viw-webgl-component
 */

import React, { useEffect, useRef, useState } from 'react'
import * as Icons from './icons'
import { ComponentCamera } from '../helpers/camera'
import { anyUiAxesButton, isTrue } from '../settings/settings'
import { SettingsState } from '../settings/settingsState'
import { VIM } from '../component'

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

  const ui = useRef<HTMLDivElement>()

  useEffect(() => {
    const subCam = viewer.camera.onSettingsChanged.subscribe(() =>
      setOrtho(viewer.camera.orthographic)
    )

    if (viewer.gizmos.axes.canvas) {
      ui.current.appendChild(viewer.gizmos.axes.canvas)
      viewer.gizmos.axes.canvas.classList.add(
        'vc-block',
        '!vc-static',
        'vc-order-1',
        'vc-mx-auto',
        'vc-mb-0',
        'vc-mt-auto'
      )
    }

    // Clean up
    return () => {
      subCam()
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
    'vim-home-btn vc-flex vc-h-8 vc-w-6 vc-items-center vc-justify-center vc-rounded-full vc-text-gray-medium vc-transition-all hover:vc-text-primary-royal'

  const btnIsolation = (
    <button
      data-tip={
        props.settings.value.isolation.useIsolationMaterial
          ? 'Disable Ghosting'
          : 'Enable Ghosting'
      }
      onClick={onIsolationBtn}
      className={'vim-isolation-btn' + btnStyle}
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
      className={'vim-home-btn' + btnStyle}
      type="button"
    >
      <Icons.home height={20} width={20} fill="currentColor" />{' '}
    </button>
  )
  const btnOrtho = (
    <button
      data-tip={ortho ? 'Orthographic' : 'Perspective'}
      onClick={() => (props.viewer.camera.orthographic = !ortho)}
      className={'vim-camera-btn' + btnStyle}
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

  const createButton = (button: JSX.Element, condition: boolean = true) => {
    if (!condition) return null
    return <div className="vc-mx-1 ">{button}</div>
  }

  const hidden = isTrue(props.settings.value.ui.axesPanel) ? '' : ' vc-hidden'

  const createBar = () => {
    if (!anyUiAxesButton(props.settings.value)) {
      return (
        // Keeps layout when all buttons are disabled.
        <span className="vc-pointer-events-auto vc-order-2 vc-mb-0 vc-mt-auto vc-flex vc-justify-center vc-rounded-b-xl vc-bg-white" />
      )
    }
    return (
      <div className="vim-top-buttons vc-pointer-events-auto vc-order-2 vc-mb-0 vc-mt-auto vc-flex vc-justify-center vc-rounded-b-xl vc-bg-white vc-p-1">
        {createButton(
          btnOrtho,
          props.settings.value.capacity.useOrthographicCamera &&
            isTrue(props.settings.value.ui.orthographic)
        )}
        {createButton(btnHome, isTrue(props.settings.value.ui.resetCamera))}
        {createButton(
          btnIsolation,
          isTrue(props.settings.value.ui.enableGhost)
        )}
      </div>
    )
  }

  return (
    <div
      ref={ui}
      className={
        'vim-axes-panel vc-absolute vc-right-6 vc-top-6 vc-z-20 vc-flex vc-h-[144px] vc-w-[112px] vc-flex-col vc-rounded-2xl vc-border vc-border-white vc-opacity-50 vc-shadow-lg vc-saturate-0 vc-transition-all hover:vc-opacity-100 hover:vc-saturate-100' +
        hidden
      }
    >
      {createBar()}
    </div>
  )
}
