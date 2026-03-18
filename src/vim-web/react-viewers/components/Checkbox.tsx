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
      className={`vim-settings-checkbox vc-checked:bg-primary-royal vc-mr-2 vc-rounded vc-border vc-border-gray-medium ${className}`}
    />
  )

  if (!label) return input

  return (
    <label className={`vc-flex vc-items-center vc-select-none vc-cursor-pointer ${disabled ? 'vc-opacity-50 vc-pointer-events-none' : ''}`}>
      {input}
      <span>{label}</span>
    </label>
  )
}
