import React from 'react'

const base = 'vim-control-bar-button vc-rounded-full vc-items-center vc-justify-center vc-flex vc-transition-all hover:vc-scale-110'

type IconButtonVariant = 'default' | 'expand' | 'disabled' | 'blue'

function getClass(variant: IconButtonVariant, on: boolean): string {
  switch (variant) {
    case 'expand':
      return on
        ? `${base} vc-text-white vc-bg-primary`
        : `${base} vc-text-gray-medium`
    case 'disabled':
      return on
        ? `${base} vc-text-gray-medium`
        : `${base} vc-text-gray vc-pointer-events-none`
    case 'blue':
      return `${base} vc-text-white`
    default: // 'default'
      return on
        ? `${base} vc-text-primary`
        : `${base} vc-text-gray-medium`
  }
}

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  on?: boolean
  variant?: IconButtonVariant
}

export function IconButton({
  on = false,
  variant = 'default',
  className,
  children,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      className={getClass(variant, on)}
      {...rest}
    >
      {children}
    </button>
  )
}
