import React, { useEffect, useRef, useState } from 'react'
import * as VIM from 'vim-webgl-viewer/'

export type ToastConfigSpeed = {
  visible: boolean
  speed: number
}

export const MenuToast = React.memo(_MenuToast)
function _MenuToast (props: { viewer: VIM.Viewer }) {
  const [visible, setVisible] = useState<boolean>()
  const [speed, setSpeed] = useState<number>(-1)
  const speedRef = useRef<number>(speed)
  const toastTimeout = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    speedRef.current = props.viewer.camera.speed
    const subCam = props.viewer.camera.onValueChanged.subscribe(() => {
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
      className={`vim-menu-toast rounded shadow-lg py-2 px-5 flex items-center justify-between transition-all ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <span className="text-sm uppercase font-semibold text-gray-light">
        Speed:
      </span>
      <span className="font-bold text-lg text-white ml-1">{speed + 25}</span>
    </div>
  )
}
