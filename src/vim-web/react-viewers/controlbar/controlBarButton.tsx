import * as Style from './style'
import { IconOptions } from '../icons'

export interface IControlBarButton {
  id: string,
  enabled?: (() => boolean) | undefined
  tip: string
  action: () => void
  icon: (options?: IconOptions) => JSX.Element
  isOn?: () => boolean
  style?: (on: boolean) => string
}

export function createButton (button: IControlBarButton) {
  if (button.enabled !== undefined && !button.enabled()) return null
  const style = (button.style?? Style.buttonDefaultStyle)(button.isOn?.())

  return (
    <button key={button.id} id={button.id} data-tip={button.tip} onClick={button.action} className={style} type="button">
      {button.icon({ className: 'vc-max-h-[80%]' })}
    </button>
  )
}

