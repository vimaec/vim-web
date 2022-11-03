import React from 'react'
import * as VIM from 'vim-webgl-viewer/'
import { Settings, SettingsState } from './settings'
import { cloneDeep } from 'lodash-es'

export function MenuSettings (props: {
  visible: boolean
  viewer: VIM.Viewer
  settings: SettingsState
}) {
  if (!props.visible) return null
  const toggleElement = (label: string, state: boolean, action: () => void) => {
    return (
      <label className="text-gray-warm m-1 w-max py-1 flex items-center select-none">
        <input
          type="checkbox"
          checked={state}
          onChange={action}
          className="w-[18px] h-[18px] rounded border border-gray-medium checked:bg-primary-royal mr-2 "
        ></input>{' '}
        {label}
      </label>
    )
  }
  const next = cloneDeep(props.settings.value)

  const settingsToggle = (
    label: string,
    getter: (settings: Settings) => boolean,
    setter: (settings: Settings, b: boolean) => void
  ) => {
    return toggleElement(label, getter(props.settings.value), () => {
      setter(next, !getter(next))
      props.settings.set(next)
    })
  }
  // {toggleElement("Hide action menu while moving camera")}
  return (
    <>
      <h2 className="text-xs font-bold uppercase mb-6">Display Settings</h2>
      {settingsToggle(
        'Show hidden object with ghost effect',
        (settings) => settings.viewer.isolationMaterial,
        (settings, value) => (settings.viewer.isolationMaterial = value)
      )}
      {settingsToggle(
        'Show ground plane',
        (settings) => settings.viewer.groundPlane,
        (settings, value) => (settings.viewer.groundPlane = value)
      )}
      {settingsToggle(
        'Show performance',
        (settings) => settings.ui.performance,
        (settings, value) => (settings.ui.performance = value)
      )}
    </>
  )
}
