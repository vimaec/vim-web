import { useEffect, useRef, useState } from 'react'

type SelectOption = {
  label: string
  value: string
}

type SelectProps = {
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  disabled?: boolean
  /** 'inline' uses a compact rounded style (settings panel), 'full' fills its container (generic fields) */
  variant?: 'inline' | 'full'
}

const chevron = (
  <svg className="vim-select-chevron" viewBox="0 0 12 12">
    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export function Select({ value, options, onChange, disabled, variant = 'inline' }: SelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const current = options.find(o => o.value === value)

  return (
    <div
      ref={ref}
      className='vim-select'
      data-variant={variant}
      data-disabled={disabled || undefined}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className='vim-select-trigger'
      >
        <span className="vim-select-label">{current?.label ?? ''}</span>
        {chevron}
      </button>
      {open && (
        <div className='vim-select-list'>
          {options.map(opt => (
            <div
              key={opt.value}
              className='vim-select-option'
              data-selected={opt.value === value || undefined}
              onPointerDown={(e) => {
                e.stopPropagation()
                onChange(opt.value)
                setOpen(false)
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
