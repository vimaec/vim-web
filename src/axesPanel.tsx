import React, { useEffect, useRef, useState } from 'react'
import * as Icons from './icons'
import { ViewerWrapper } from './helpers/viewer'
import { Settings } from './settings/settings'

export const AxesPanel = React.memo(_AxesPanel)
function _AxesPanel (props: { viewer: ViewerWrapper; settings: Settings }) {
  const viewer = props.viewer.base
  const helper = props.viewer

  const [ortho, setOrtho] = useState<boolean>(viewer.camera.orthographic)

  const ui = useRef<HTMLDivElement>()

  useEffect(() => {
    const subCam = viewer.camera.onValueChanged.subscribe(() =>
      setOrtho(viewer.camera.orthographic)
    )
    const axes = document.getElementsByClassName('gizmo-axis-canvas')[0]
    ui.current.appendChild(axes)
    axes.classList.add(
      'vc-block',
      '!vc-static',
      'vc-order-1',
      'vc-mx-auto',
      'vc-mb-0',
      'vc-mt-auto'
    )

    // Clean up
    return () => {
      subCam()
    }
  }, [])

  const onHomeBtn = () => {
    helper.resetCamera()
  }

  const btnHome = (
    <button
      data-tip="Reset Camera"
      onClick={onHomeBtn}
      className={
        'vim-home-btn vc-flex vc-h-8 vc-w-8 vc-items-center vc-justify-center vc-rounded-full vc-text-gray-medium vc-transition-all hover:vc-text-primary-royal'
      }
      type="button"
    >
      <Icons.home height="20" width="20" fill="currentColor" />{' '}
    </button>
  )
  const btnOrtho = (
    <button
      data-tip={ortho ? 'Orthographic' : 'Perspective'}
      onClick={() => (props.viewer.base.camera.orthographic = !ortho)}
      className={
        'vim-camera-btn vc-flex vc-h-8 vc-w-8 vc-items-center vc-justify-center vc-rounded-full vc-text-gray-medium vc-transition-all hover:vc-text-primary-royal'
      }
      type="button"
    >
      {ortho
        ? (
        <Icons.orthographic height="20" width="20" fill="currentColor" />
          )
        : (
        <Icons.perspective height="20" width="20" fill="currentColor" />
          )}
    </button>
  )

  return (
    <div
      ref={ui}
      className="vim-axes-panel vc-fixed vc-right-6 vc-top-6 vc-z-20 vc-flex vc-h-[145px] vc-w-[100px] vc-flex-col vc-rounded-2xl vc-border vc-border-white vc-opacity-50 vc-shadow-lg vc-saturate-0 vc-transition-all hover:vc-opacity-100 hover:vc-saturate-100"
    >
      <div className="vim-top-buttons vc-pointer-events-auto vc-order-2 vc-mb-0 vc-mt-auto vc-flex vc-justify-center vc-rounded-b-xl vc-bg-white vc-p-1">
        <div className="vc-mx-1">
          {props.settings.capacity.useOrthographicCamera ? btnOrtho : null}
        </div>
        <div className="vc-mx-1">{btnHome}</div>
      </div>
    </div>
  )
}
