/**
 * @module viw-webgl-component
 */

import React from 'react'
import * as VIM from 'vim-webgl-viewer/'
import { RestrictedOption, Settings, SettingsState } from './settings'
import { cloneDeep } from 'lodash-es'

/**
 * JSX Component to interact with settings.
 * @param viewer current viewer
 * @param settings setting state
 * @param visible will return null if this is false.
 * @returns
 */
export function MenuSettings (props: {
  viewer: VIM.Viewer
  settings: SettingsState
  visible: boolean
}) {
  if (!props.visible) return null
  const toggleElement = (label: string, state: boolean, action: () => void) => {
    return (
      <label className="vc-m-1 vc-flex vc-select-none vc-items-center vc-py-1 vc-text-gray-warm">
        <input
          type="checkbox"
          checked={state}
          onChange={action}
          className="vc-checked:bg-primary-royal vc-mr-2 vc-h-[18px] vc-w-[18px] vc-rounded vc-border vc-border-gray-medium "
        ></input>{' '}
        {label}
      </label>
    )
  }

  const settingsToggle = (
    label: string,
    getter: (settings: Settings) => RestrictedOption,
    setter: (settings: Settings, b: boolean) => void
  ) => {
    const value = getter(props.settings.value)
    if (value === 'restricted') {
      return null
    }
    return toggleElement(label, value, () => {
      const value = getter(props.settings.value) as boolean
      props.settings.update((s) => setter(s, !value))
    })
  }
  // {toggleElement("Hide action menu while moving camera")}
  return (
    <>
      <h2 className="vc-mb-6 vc-text-xs vc-font-bold vc-uppercase">
        Display Settings
      </h2>
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
        'Show Logo',
        (settings) => settings.ui.logo,
        (settings, value) => (settings.ui.logo = value)
      )}
      {settingsToggle(
        'Show Bim Tree',
        (settings) => settings.ui.bimTreePanel,
        (settings, value) => (settings.ui.bimTreePanel = value)
      )}
      {settingsToggle(
        'Show Bim Info',
        (settings) => settings.ui.bimInfoPanel,
        (settings, value) => (settings.ui.bimInfoPanel = value)
      )}
      {settingsToggle(
        'Show Axes',
        (settings) => settings.ui.axesPanel,
        (settings, value) => (settings.ui.axesPanel = value)
      )}
      {settingsToggle(
        'Show Control Bar Cursors',
        (settings) => settings.ui.controlBarCursors,
        (settings, value) => (settings.ui.controlBarCursors = value)
      )}
      {settingsToggle(
        'Show Control Bar Tools',
        (settings) => settings.ui.controlBarTools,
        (settings, value) => (settings.ui.controlBarTools = value)
      )}
      {settingsToggle(
        'Show Control Bar Settings',
        (settings) => settings.ui.controlBarSettings,
        (settings, value) => (settings.ui.controlBarSettings = value)
      )}
      {settingsToggle(
        'Show performance',
        (settings) => settings.ui.performance,
        (settings, value) => (settings.ui.performance = value)
      )}
      {settingsToggle(
        'Show Logs',
        (settings) => settings.ui.logPanel,
        (settings, value) => (settings.ui.logPanel = value)
      )}
    </>
  )
}
