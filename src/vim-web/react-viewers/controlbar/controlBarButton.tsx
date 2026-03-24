import { IconOptions } from '../icons'
import { IconButton } from '../components'
import { ButtonVariant } from './style'

export interface IControlBarButton {
  id: string,
  enabled?: (() => boolean) | undefined
  tip: string | (() => string)
  action: () => void
  icon: (options?: IconOptions) => JSX.Element
  isOn?: () => boolean
  variant?: ButtonVariant
}

export function createButton (button: IControlBarButton) {
  if (button.enabled !== undefined && !button.enabled()) return null
  const variant = button.variant ?? 'default'
  const on = button.isOn?.() ?? false

  return (
    <IconButton key={button.id} variant={variant} on={on} data-tip={typeof button.tip === 'function' ? button.tip() : button.tip} onClick={button.action}>
      {button.icon()}
    </IconButton>
  )
}
