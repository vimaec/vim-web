/**
 * @module viw-webgl-react
 */

import React, { useEffect, useRef, useState } from 'react'
import * as Core from '../../core-viewers'
import * as Icons from '../icons'
import { FramingApi } from '../state/cameraState'
import { whenAllTrue, whenTrue } from '../helpers/utils'
import { WebglSettings } from '../webgl/settings'
import { isTrue } from '../settings/userBoolean'

function anyUiAxesButton (settings: WebglSettings) {
  return (
    settings.ui.axesOrthographic ||
    settings.ui.axesHome
  )
}

/**
 * Memoized version of the AxesPanelMemo.
 */
export const AxesPanelMemo = React.memo(AxesPanel)

/**
 * JSX Component for axes gizmo.
 */
function AxesPanel (props: { viewer: Core.Webgl.Viewer, framing: FramingApi, settings: WebglSettings }) {
  const viewer = props.viewer

  const [ortho, setOrtho] = useState<boolean>(viewer.camera.orthographic)

  const gizmoDiv = useRef<HTMLDivElement>(null)
  const resize = useRef<ResizeObserver>(undefined)

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
      viewer.gizmos.axes.canvas.classList.add('vim-axes-canvas')
    }

    // Clean up
    return () => {
      subCam()
      resize.current?.disconnect()
    }
  }, [])

  const onHomeBtn = () => {
    props.framing.reset.call()
  }

  const btnHome = (
    <button
      data-tip="Reset Camera"
      onClick={onHomeBtn}
      className='vim-axes-button vim-home-btn'
      type="button"
    >
      <Icons.home height={20} width={20} fill="currentColor" />
    </button>
  )

  const btnOrtho = (
    <button
      data-tip={ortho ? 'Orthographic' : 'Perspective'}
      onClick={() => (props.viewer.camera.orthographic = !ortho)}
      className='vim-axes-button vim-camera-btn'
      type="button"
    >
      {ortho
        ? <Icons.orthographic height={20} width={20} fill="currentColor" />
        : <Icons.perspective height={20} width={20} fill="currentColor" />
      }
    </button>
  )

  const empty = !anyUiAxesButton(props.settings)
  const hidden = isTrue(props.settings.ui.panelAxes) ? '' : ' vim-hidden'

  const createBar = () => {
    if (empty) return null
    return (
      <div className="vim-axes-panel-buttons">
        {whenAllTrue([props.settings.ui.axesOrthographic], btnOrtho)}
        {whenTrue(props.settings.ui.axesHome, btnHome)}
      </div>
    )
  }

  return (
    <div className={`${empty ? 'vim-axes-panel-empty' : 'vim-axes-panel'}${hidden}`}>
      <div ref={gizmoDiv} className='vim-axes-panel-gizmo'/>
      {createBar()}
    </div>
  )
}
