/**
 * @module viw-webgl-react
 */

import React, { useEffect, useRef, useState } from 'react'
import * as Core from '../../core-viewers'
import { SideState } from '../state/sideState'

export type ToastConfigSpeed = {
  visible: boolean
  speed: number
}

/**
 * Memoized version of MenuToast.
 */
export const MenuToastMemo = React.memo(MenuToast)

/**
 * Toast jsx component that briefly shows up when camera speed changes.
 */
function MenuToast (props: { viewer: Core.Webgl.Viewer; side: SideState }) {
  const [visible, setVisible] = useState<boolean>()
  const [speed, setSpeed] = useState<number>(-1)
  const speedRef = useRef<number>(speed)
  const toastTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    speedRef.current = props.viewer.inputs.moveSpeed
    const subCam = props.viewer.inputs.onSettingsChanged.subscribe(() => {
      if (props.viewer.inputs.moveSpeed !== speedRef.current) {
        clearTimeout(toastTimeout.current)
        toastTimeout.current = setTimeout(() => setVisible(false), 1000)

        speedRef.current = props.viewer.inputs.moveSpeed
        setSpeed(props.viewer.inputs.moveSpeed)
        setVisible(true)
      }
    })

    return () => {
      subCam()
      clearTimeout(toastTimeout.current)
    }
  }, [])

  return (
    <div
      className='vim-menu-toast-wrapper'
      style={{
        marginLeft: props.side.getWidth(),
        width: `calc(100% - ${props.side.getWidth()}px)`
      }}
    >
      <div className='vim-menu-toast' data-visible={String(!!visible)}>
        <span className="vim-menu-toast-label">Speed:</span>
        <span className="vim-menu-toast-value">{speed + 25}</span>
      </div>
    </div>
  )
}
