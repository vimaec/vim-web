import React, { forwardRef, useEffect, useState } from 'react'

interface LocalTextBoxProps {
  label: string;
  storageKey: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}

export const LocalTextBox = forwardRef<HTMLInputElement, LocalTextBoxProps>((props, ref) => {
  const [value, setValue] = useState(() =>
    localStorage.getItem(props.storageKey) || props.defaultValue
  )

  useEffect(() => {
    localStorage.setItem(props.storageKey, value || '')
  }, [value, props.storageKey])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
    props.onChange?.(e.target.value)
  }

  return (
    <div className="vc-flex vc-flex-col">
      <label className="vc-text-sm vc-font-medium">{props.label}</label>
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={handleChange}
        className="vc-border vc-rounded vc-px-2 vc-py-1"
      />
    </div>
  )
})

LocalTextBox.displayName = 'LocalTextBox'
