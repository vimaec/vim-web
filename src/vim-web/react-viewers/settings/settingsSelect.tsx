import { useEffect, useRef, useState } from 'react'
import { SettingsSelect } from './settingsItem'
import { SettingsState } from './settingsState'
import { AnySettings } from './anySettings'

/**
 * Renders a select (dropdown) UI element for a given SettingsSelect item.
 */
export function renderSettingsSelect(
  settings: SettingsState<AnySettings>,
  item: SettingsSelect<AnySettings>
): JSX.Element {
  const value = item.getter(settings.value)
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

  const current = item.options.find(o => o.value === value)

  return (
    <label className="vc-m-1 vc-block vc-select-none vc-items-center vc-py-1 vc-text-gray-warm">
      {item.label}
      <div ref={ref} className="vc-relative vc-inline-block vc-ml-2">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="vc-rounded vc-border vc-border-gray-medium vc-bg-white vc-px-1 vc-py-0.5 vc-text-sm vc-cursor-pointer vc-text-left vc-inline-flex vc-items-center vc-gap-1"
        >
          <span>{current?.label ?? ''}</span>
          <svg className="vc-w-3 vc-h-3 vc-shrink-0" viewBox="0 0 12 12">
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        {open && (
          <div className="vc-absolute vc-left-0 vc-bottom-full vc-z-50 vc-min-w-full vc-rounded vc-border vc-border-gray-medium vc-bg-white vc-shadow-lg vc-text-sm">
            {item.options.map(opt => (
              <div
                key={opt.value}
                className={`vc-px-2 vc-py-1 vc-cursor-pointer hover:vc-bg-gray-100 vc-whitespace-nowrap ${
                  opt.value === value ? 'vc-bg-gray-100' : ''
                }`}
                onPointerDown={(e) => {
                  e.stopPropagation()
                  settings.update((s) => item.setter(s, opt.value))
                  setOpen(false)
                }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </label>
  )
}
