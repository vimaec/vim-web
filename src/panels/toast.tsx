/**
 * @module viw-webgl-component
 */

import React, { useEffect, useRef, useState } from 'react'
import * as VIM from 'vim-webgl-viewer/'
import { SideState } from '../sidePanel/sideState'

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
function MenuToast (props: { viewer: VIM.Viewer; side: SideState }) {
  const [visible, setVisible] = useState<boolean>()
  const [speed, setSpeed] = useState<number>(-1)
  const speedRef = useRef<number>(speed)
  const toastTimeout = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    speedRef.current = props.viewer.camera.speed
    const subCam = props.viewer.camera.onSettingsChanged.subscribe(() => {
      if (props.viewer.camera.speed !== speedRef.current) {
        clearTimeout(toastTimeout.current)
        toastTimeout.current = setTimeout(() => setVisible(false), 1000)

        speedRef.current = props.viewer.camera.speed
        setSpeed(props.viewer.camera.speed)
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
      className={
        'vim-menu-toast vc-pointer-events-none vc-absolute vc-top-[10%] vc-flex'
      }
      style={{
        marginLeft: props.side.getWidth(),
        width: `calc(100% - ${props.side.getWidth()}px)`
      }}
    >
      <div
        className={`vim-menu-toast vc-m-auto vc-flex vc-items-center vc-justify-between vc-rounded vc-bg-gray-warm vc-py-2 vc-px-5 vc-shadow-lg vc-transition-all ${
          visible ? 'vc-opacity-100' : 'vc-opacity-0'
        }`}
      >
        <span className="vc-text-sm vc-font-semibold vc-uppercase vc-text-gray-light">
          Speed:
        </span>
        <span className="vc-ml-1 vc-text-lg vc-font-bold vc-text-white">
          {speed + 25}
        </span>
      </div>
    </div>
  )
}
