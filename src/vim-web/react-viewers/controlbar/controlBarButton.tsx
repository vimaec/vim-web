const btnStyle = 'vim-control-bar-button vc-rounded-full vc-items-center vc-justify-center vc-flex vc-transition-all hover:vc-scale-110'
export function buttonDefaultStyle (on: boolean) {
  return on
    ? btnStyle + ' vc-text-primary'
    : btnStyle + ' vc-text-gray-medium'
}

export function buttonExpandStyle (on: boolean) {
  return on
    ? btnStyle + ' vc-text-white vc-bg-primary'
    : btnStyle + ' vc-text-gray-medium'
}

export function buttonDisableStyle (on: boolean) {
  return on
    ? btnStyle + ' vc-text-gray-medium'
    : btnStyle + ' vc-text-gray vc-pointer-events-none'
}

export function buttonBlueStyle (on: boolean) {
  return btnStyle + ' vc-text-white'
}

export interface IControlBarButtonItem {
  id: string,
  enabled?: (() => boolean) | undefined
  tip: string
  action: () => void
  icon: ({ height, width, fill, className }) => JSX.Element
  isOn?: () => boolean
  style?: (on: boolean) => string
}

export function createButton (button: IControlBarButtonItem) {
  if (button.enabled !== undefined && !button.enabled()) return null
  const style = (button.style?? buttonDefaultStyle)(button.isOn?.())

  return (
    <button key={button.id} id={button.id} data-tip={button.tip} onClick={button.action} className={style} type="button">
      {button.icon({ height: '20', width: '20', fill: 'currentColor', className: 'vc-max-h-[80%]' })}
    </button>
  )
}
