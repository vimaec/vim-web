import React from 'react'
import * as VIM from 'vim-webgl-viewer/'
import { Settings, SettingsState } from './settings'

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
  const next = props.settings.get.clone()

  const settingsToggle = (
    label: string,
    getter: (settings: Settings) => boolean,
    setter: (settings: Settings, b: boolean) => void
  ) => {
    return toggleElement(label, getter(props.settings.get), () => {
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
        (settings) => settings.useIsolationMaterial,
        (settings, value) => (settings.useIsolationMaterial = value)
      )}
      {settingsToggle(
        'Show ground plane',
        (settings) => settings.showGroundPlane,
        (settings, value) => (settings.showGroundPlane = value)
      )}
      {settingsToggle(
        'Show performance',
        (settings) => settings.showPerformance,
        (settings, value) => (settings.showPerformance = value)
      )}
    </>
  )
}
