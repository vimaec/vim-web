import React from 'react'

type CheckboxProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
  className?: string
}

export function Checkbox({ checked, onChange, disabled, label, className = '' }: CheckboxProps) {
  const input = (
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
      className={`vim-settings-checkbox ${className}`}
    />
  )

  if (!label) return input

  return (
    <label className='vim-checkbox-label' data-disabled={disabled || undefined}>
      {input}
      <span>{label}</span>
    </label>
  )
}
