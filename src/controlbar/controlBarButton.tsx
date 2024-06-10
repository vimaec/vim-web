import React from 'react'

const btnStyle = 'vim-control-bar-button vc-rounded-full vc-items-center vc-justify-center vc-flex vc-transition-all hover:vc-scale-110'

export function createButton (
  enabled: () => boolean,
  tip: string,
  action: () => void,
  icon: ({ height, width, fill, className }) => JSX.Element,
  isOn?: () => boolean
) {
  return createAnyButton(enabled, tip, action, icon, isOn)
}
export function createBlueButton (
  enabled: () => boolean,
  tip: string,
  action: () => void,
  icon: ({ height, width, fill, className }) => JSX.Element,
  isOn?: () => boolean
) {
  return createAnyButton(enabled, tip, action, icon, isOn, { on: 'vc-text-white', off: 'vc-text-white' })
}

function createAnyButton (
  enabled: () => boolean,
  tip: string,
  action: () => void,
  icon: ({ height, width, fill, className }) => JSX.Element,
  isOn: () => boolean,
  colors: { on: string, off: string } = { on: 'vc-text-primary', off: 'vc-text-gray-medium' }
) {
  if (!enabled()) return null
  const style = isOn?.()
    ? btnStyle + ' ' + colors.on
    : btnStyle + ' ' + colors.off

  return (
    <button data-tip={tip} onClick={action} className={style} type="button">
      {icon({ height: '20', width: '20', fill: 'currentColor', className: 'vc-max-h-[80%]' })}
    </button>
  )
}
