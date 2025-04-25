import * as Style from './style'

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
  const style = (button.style?? Style.buttonDefaultStyle)(button.isOn?.())

  return (
    <button key={button.id} id={button.id} data-tip={button.tip} onClick={button.action} className={style} type="button">
      {button.icon({ height: '20', width: '20', fill: 'currentColor', className: 'vc-max-h-[80%]' })}
    </button>
  )
}

