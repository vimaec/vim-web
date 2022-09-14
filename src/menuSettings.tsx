import React from 'react'
import * as VIM from 'vim-webgl-viewer/'
import { Settings } from './component'

export function MenuSettings (props: {
  viewer: VIM.Viewer
  settings: Settings
  setSettings: (value: Settings) => void
}) {
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

  const next = props.settings.clone()
  const onGhostTgl = () => {
    next.useIsolationMaterial = !next.useIsolationMaterial
    props.setSettings(next)
  }

  const onGroundPlaneTgl = () => {
    next.showGroundPlane = !next.showGroundPlane
    props.setSettings(next)
  }

  const onPerformanceTgl = () => {
    next.showPerformance = !next.showPerformance
    props.setSettings(next)
  }

  // {toggleElement("Hide action menu while moving camera")}
  return (
    <>
      <h2 className="text-xs font-bold uppercase mb-6">Display Settings</h2>
      {toggleElement(
        'Show hidden object with ghost effect',
        props.settings.useIsolationMaterial,
        onGhostTgl
      )}
      {toggleElement(
        'Show ground plane',
        props.settings.showGroundPlane,
        onGroundPlaneTgl
      )}
      {toggleElement(
        'Show performance',
        props.settings.showPerformance,
        onPerformanceTgl
      )}
    </>
  )
}
