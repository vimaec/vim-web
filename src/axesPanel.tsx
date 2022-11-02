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
        'rounded-full text-gray-medium h-8 w-8 flex items-center justify-center transition-all hover:text-primary-royal'
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
        'rounded-full text-gray-medium h-8 w-8 flex items-center justify-center transition-all hover:text-primary-royal'
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
      className="vim-top border z-20 border-white flex flex-col fixed right-6 top-6 w-[100px] h-[145px] rounded-2xl shadow-lg transition-all"
    >
      <div className="vim-top-buttons order-2 flex p-1 rounded-b-xl pointer-events-auto justify-center bg-white mb-0 mt-auto">
        <div className="mx-1">
          {props.settings.useOrthographicCameraBtn ? btnOrtho : null}
        </div>
        <div className="mx-1">{btnHome}</div>
      </div>
    </div>
  )
}
