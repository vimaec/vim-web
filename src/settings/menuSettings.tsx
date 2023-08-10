/**
 * @module viw-webgl-component
 */

import React from 'react'
import * as VIM from 'vim-webgl-viewer/'
import { RestrictedOption, Settings, SettingsState } from './settings'

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
      <label className="vc-m-1 vc-block vc-select-none vc-items-center vc-py-1 vc-text-gray-warm">
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

  return (
    <>
      <h2 className="vc-mb-6 vc-text-xs vc-font-bold vc-uppercase">
        Display Settings
      </h2>
      <div className="vim-settings vc-m-1 vc-max-h-[95%] vc-overflow-y-auto">
        <h3 className="vc-mt-2 vc-text-xs vc-font-bold">Viewer</h3>
        {settingsToggle(
          'Ghost Hidden Objects',
          (settings) => settings.viewer.isolationMaterial,
          (settings, value) => (settings.viewer.isolationMaterial = value)
        )}
        {settingsToggle(
          'Show Ground Plane',
          (settings) => settings.viewer.groundPlane,
          (settings, value) => (settings.viewer.groundPlane = value)
        )}
        <h3 className="vc-mt-2 vc-text-xs vc-font-bold">Panels</h3>
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
          'Show Axes Panel',
          (settings) => settings.ui.axesPanel,
          (settings, value) => (settings.ui.axesPanel = value)
        )}
        {settingsToggle(
          'Show Performance Panel',
          (settings) => settings.ui.performance,
          (settings, value) => (settings.ui.performance = value)
        )}
        {settingsToggle(
          'Show Loading Box',
          (settings) => settings.ui.loadingBox,
          (settings, value) => (settings.ui.loadingBox = value)
        )}
        {settingsToggle(
          'Show Logs Panel',
          (settings) => settings.ui.logPanel,
          (settings, value) => (settings.ui.logPanel = value)
        )}
        <h3 className="vc-mt-2 vc-text-xs vc-font-bold">Axes</h3>
        {settingsToggle(
          'Show Orthographic Button',
          (settings) => settings.ui.orthographic,
          (settings, value) => (settings.ui.orthographic = value)
        )}
        {settingsToggle(
          'Show Reset Camera Button',
          (settings) => settings.ui.resetCamera,
          (settings, value) => (settings.ui.resetCamera = value)
        )}
        {settingsToggle(
          'Show Toggle Ghost Button',
          (settings) => settings.ui.enableGhost,
          (settings, value) => (settings.ui.enableGhost = value)
        )}
        <h3 className="vc-mt-2 vc-text-xs vc-font-bold">Cursors</h3>
        {settingsToggle(
          'Show Orbit Button',
          (settings) => settings.ui.orbit,
          (settings, value) => (settings.ui.orbit = value)
        )}
        {settingsToggle(
          'Show Look Around Button',
          (settings) => settings.ui.lookAround,
          (settings, value) => (settings.ui.lookAround = value)
        )}
        {settingsToggle(
          'Show Pan Button',
          (settings) => settings.ui.pan,
          (settings, value) => (settings.ui.pan = value)
        )}
        {settingsToggle(
          'Show Zoom Button',
          (settings) => settings.ui.zoom,
          (settings, value) => (settings.ui.zoom = value)
        )}
        {settingsToggle(
          'Show Zoom Window Button',
          (settings) => settings.ui.zoomWindow,
          (settings, value) => (settings.ui.zoomWindow = value)
        )}
        {settingsToggle(
          'Show Zoom To Fit Button',
          (settings) => settings.ui.zoomToFit,
          (settings, value) => (settings.ui.zoomToFit = value)
        )}
        <h3 className="vc-mt-2 vc-text-xs vc-font-bold">Tool</h3>
        {settingsToggle(
          'Show Sectioning Mode Button ',
          (settings) => settings.ui.sectioningMode,
          (settings, value) => (settings.ui.sectioningMode = value)
        )}
        {settingsToggle(
          'Show Measuring Mode Button',
          (settings) => settings.ui.measuringMode,
          (settings, value) => (settings.ui.measuringMode = value)
        )}
        {settingsToggle(
          'Show Toggle Isolation Button',
          (settings) => settings.ui.toggleIsolation,
          (settings, value) => (settings.ui.toggleIsolation = value)
        )}
        <h3 className="vc-mt-2 vc-text-xs vc-font-bold">Settings</h3>
        {settingsToggle(
          'Show Project Inspector Button',
          (settings) => settings.ui.projectInspector,
          (settings, value) => (settings.ui.projectInspector = value)
        )}
        {settingsToggle(
          'Show Settings Button',
          (settings) => settings.ui.settings,
          (settings, value) => (settings.ui.settings = value)
        )}
        {settingsToggle(
          'Show Help Button',
          (settings) => settings.ui.help,
          (settings, value) => (settings.ui.help = value)
        )}
        {settingsToggle(
          'Show Maximise Button',
          (settings) => settings.ui.maximise,
          (settings, value) => (settings.ui.maximise = value)
        )}
      </div>
    </>
  )
}
