import * as Style from './style'
import { IconOptions } from '../icons'
import { IconButton } from '../components'

export interface IControlBarButton {
  id: string,
  enabled?: (() => boolean) | undefined
  tip: string
  action: () => void
  icon: (options?: IconOptions) => JSX.Element
  isOn?: () => boolean
  style?: (on: boolean) => string
}

function resolveVariant (styleFn: (on: boolean) => string): 'default' | 'expand' | 'disabled' | 'blue' {
  if (styleFn === Style.buttonExpandStyle) return 'expand'
  if (styleFn === Style.buttonDisableStyle || styleFn === Style.buttonDisableDefaultStyle) return 'disabled'
  if (styleFn === Style.buttonBlueStyle) return 'blue'
  return 'default'
}

export function createButton (button: IControlBarButton) {
  if (button.enabled !== undefined && !button.enabled()) return null
  const styleFn = button.style ?? Style.buttonDefaultStyle
  const variant = resolveVariant(styleFn)
  const on = button.isOn?.() ?? false

  return (
    <IconButton key={button.id} variant={variant} on={on} title={button.tip} onClick={button.action}>
      {button.icon({ className: 'vc-max-h-[80%]' })}
    </IconButton>
  )
}

