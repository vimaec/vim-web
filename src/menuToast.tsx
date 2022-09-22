import React from 'react'

export type ToastConfigSpeed = {
  visible: boolean
  speed: number
}
export type ToastConfig = ToastConfigSpeed | undefined

export function MenuToast (props: { config: ToastConfig }) {
  if (!props.config) return null

  return (
    <div
      className={`vim-menu-toast rounded shadow-lg py-2 px-5 flex items-center justify-between transition-all ${
        props.config.visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <span className="text-sm uppercase font-semibold text-gray-light">
        Speed:
      </span>
      <span className="font-bold text-lg text-white ml-1">
        {props.config.speed + 25}
      </span>
    </div>
  )
}
