import React from 'react'

const inputClass = 'vc-border vc-inline vc-border-gray-300 vc-py-1 vc-w-full vc-px-1'

type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export function Input({ type = 'text', className = '', ...props }: InputProps) {
  return (
    <input
      type={type}
      className={`${inputClass} ${className}`}
      {...props}
    />
  )
}
