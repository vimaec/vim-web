import React from 'react'
import { ButtonVariant } from '../controlbar/style'

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  on?: boolean
  variant?: ButtonVariant
}

export function IconButton({
  on = false,
  variant = 'default',
  children,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      className='vim-control-bar-button'
      data-variant={variant}
      data-on={String(on)}
      {...rest}
    >
      {children}
    </button>
  )
}
