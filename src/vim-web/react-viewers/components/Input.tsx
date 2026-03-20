import React from 'react'

type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export function Input({ type = 'text', className = '', ...props }: InputProps) {
  return (
    <input
      type={type}
      className={`vim-settings-textbox ${className}`}
      {...props}
    />
  )
}
