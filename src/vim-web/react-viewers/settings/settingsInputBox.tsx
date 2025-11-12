import React, { useEffect } from 'react'
import { SettingsBox } from './settingsItem'
import * as Core from '../../core-viewers'
import { SettingsState } from './settingsState'

export function renderSettingsInputBox(viewer: Core.Webgl.Viewer, settings: SettingsState, item: SettingsBox) {
  const ref = React.useRef<HTMLInputElement>(null)

  useEffect(() => {
    ref.current.value = item.getter(settings.value)?.toString()
  }, [])

  const update = (event: React.FocusEvent<HTMLInputElement, Element>) => {
    const str = event.target.value
    const n = Number.parseFloat(str)
    if (Number.isNaN(n)) {
      event.target.value = item.getter(settings.value).toString()
    } else {
      const value = item.transform(n)
      event.target.value = value.toString()
      settings.update((s) => item.setter(s, value))
    }
  }

  return (
    <div className="vc-box-input vc-my-1">
      <label htmlFor="textbox" className="vc-w-3 vc-h-2">
        {item.label}:
      </label>
      <input
        ref={ref}
        type="text"
        className="vim-settings-textbox vc-w-14 vc-ml-1 vc-p-1"
        onBlur={update}
      />
      <label htmlFor="textbox" className="vc-w-3 vc-h-2 vc-text-gray vc-ml-1">
        {item.info}
      </label>
    </div>
  )
}