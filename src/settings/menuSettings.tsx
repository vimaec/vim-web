/**
 * @module viw-webgl-component
 */

import React from 'react'
import * as VIM from 'vim-webgl-viewer/'
import { UserBoolean, ComponentSettings } from './settings'
import { SettingsState } from './settingsState'

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
          className="vim-settings-checkbox vc-checked:bg-primary-royal vc-mr-2 vc-rounded vc-border vc-border-gray-medium "
        ></input>{' '}
        {label}
      </label>
    )
  }

  const settingsToggle = (
    label: string,
    getter: (settings: ComponentSettings) => UserBoolean,
    setter: (settings: ComponentSettings, b: boolean) => void
  ) => {
    const value = getter(props.settings.value)
    if (value === 'AlwaysTrue' || value === 'AlwaysFalse') {
      return null
    }
    return toggleElement(label, value, () => {
      const value = getter(props.settings.value)
      props.settings.update((s) => setter(s, !value))
    })
  }

  const settingsBox = (label: string,
    info: string,
    transform : (value:number) => number,
    getter: (settings: ComponentSettings) => number,
    setter: (settings: ComponentSettings, b: number) => void) => {
    const value = getter(props.settings.value).toString()
    const update = (event: React.FocusEvent<HTMLInputElement, Element>) => {
      const str = event.target.value
      const n = Number.parseFloat(str)
      if (Number.isNaN(n)) {
        event.target.value = getter(props.settings.value).toString()
      } else {
        const value = transform(n)
        event.target.value = value.toString()
        props.settings.update(s => setter(s, value))
      }
    }

    return <div className="vc-box-input vc-my-1">
      <label htmlFor="textbox" className='vc-w-3 vc-h-2'>{label}:</label>
      <input type="text" placeholder={value} className='vim-settings-textbox vc-w-14 vc-ml-1 vc-p-1' onBlur={e => update(e)}/>
      <label htmlFor="textbox" className='vc-w-3 vc-h-2 vc-text-gray vc-ml-1'>{info}</label>
    </div>
  }

  function settingsSubtitle (title: string) {
    return (
      <h3 className="vc-subtitle">{title}</h3>
    )
  }

  return (
    <div
      className='vc-absolute vc-inset-0'>
        <h3 className="vc-title">Settings </h3>
      <div className="vim-settings vc-absolute vc-top-6 vc-left-0 vc-bottom-0 vc-right-0 vc-overflow-y-auto">
        {settingsSubtitle('Inputs')}
        {settingsBox(
          'Scroll Speed',
          '[0.1,10]',
          n => VIM.THREE.MathUtils.clamp(n, 0.1, 10),
          s => props.viewer.inputs.mouse.scrollSpeed,
          (s, v) => { props.viewer.inputs.mouse.scrollSpeed = v }
        )}
        {settingsSubtitle('Materials')}
        {settingsToggle(
          'Use Isolation Material',
          (settings) => settings.isolation.useIsolationMaterial,
          (settings, value) => {
            settings.isolation.useIsolationMaterial = value
            if (settings.peformance.useFastMaterial && value) {
              settings.peformance.useFastMaterial = false
            }
          }
        )}
        {settingsToggle(
          'Use Performance Material',
          (settings) => settings.peformance.useFastMaterial,
          (settings, value) => {
            settings.peformance.useFastMaterial = value
            if (settings.isolation.useIsolationMaterial && value) {
              settings.isolation.useIsolationMaterial = false
            }
          }
        )}
        {settingsSubtitle('Scene')}
        {settingsToggle(
          'Show Ground Plane',
          (_) => props.viewer.environment.groundPlane.visible,
          (_, value) => { props.viewer.environment.groundPlane.visible = value }
        )}
        {settingsSubtitle('Panels')}
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
        {settingsSubtitle('Axes')}
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
        {settingsSubtitle('Cursors')}
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
        {settingsSubtitle('Tools')}
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
        {settingsSubtitle('Settings')}
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
    </div>
  )
}
