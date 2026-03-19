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
  <svg className="vc-w-3 vc-h-3 vc-shrink-0" viewBox="0 0 12 12">
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

  const triggerClass = variant === 'inline'
    ? 'vc-rounded vc-border vc-border-gray-medium vc-bg-white vc-px-1 vc-py-0.5 vc-text-sm vc-cursor-pointer vc-text-left vc-inline-flex vc-items-center vc-gap-1'
    : 'vc-border vc-border-gray-300 vc-py-1 vc-w-full vc-px-1 vc-text-left vc-bg-white vc-cursor-pointer vc-flex vc-items-center vc-justify-between'

  const listClass = variant === 'inline'
    ? 'vc-absolute vc-left-0 vc-bottom-full vc-z-50 vc-min-w-full vc-rounded vc-border vc-border-gray-medium vc-bg-white vc-shadow-lg vc-text-sm'
    : 'vc-absolute vc-left-0 vc-right-0 vc-bottom-full vc-z-50 vc-border vc-border-gray-300 vc-bg-white vc-shadow-lg'

  const optionClass = (opt: SelectOption) =>
    variant === 'inline'
      ? `vc-px-2 vc-py-1 vc-cursor-pointer hover:vc-bg-gray-100 vc-whitespace-nowrap ${opt.value === value ? 'vc-bg-gray-100' : ''}`
      : `vc-px-1 vc-py-1 vc-cursor-pointer hover:vc-bg-gray-100 ${opt.value === value ? 'vc-bg-gray-100' : ''}`

  return (
    <div
      ref={ref}
      className={`vc-relative ${variant === 'full' ? 'vc-w-full' : 'vc-inline-block'} ${disabled ? 'vc-opacity-50 vc-pointer-events-none' : ''}`}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={triggerClass}
      >
        <span className="vc-flex-1 vc-min-w-0 vc-truncate">{current?.label ?? ''}</span>
        {chevron}
      </button>
      {open && (
        <div className={listClass}>
          {options.map(opt => (
            <div
              key={opt.value}
              className={optionClass(opt)}
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
