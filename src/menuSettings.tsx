import React, { useEffect, useRef } from "react";
import { useState } from 'react'
import * as VIM from 'vim-webgl-viewer/'
import { Settings } from "./component";


export function MenuSettings(props: { viewer: VIM.Viewer, settings: Settings, setSettings: (value: Settings) => void})
{
  const toggleElement = (label: string, state: boolean, action: () => void) =>{
    return <span className="vim-settings-line block">
      <input type="checkbox" checked={state} onChange={action}></input>
      <span className="text-gray-medium m-1 w-max py-1">{label} </span>
    </span>
  }

  const next = props.settings.clone()
  const onGhostTgl = () => {
    next.useIsolationMaterial = !next.useIsolationMaterial
    props.setSettings(next)
  }
  const onInspectorTgl = () => {
    next.showInspectorOnSelect = !next.showInspectorOnSelect
    props.setSettings(next)
  }

  const onGroundPlaneTgl = () => {
    next.showGroundPlane = !next.showGroundPlane
    props.setSettings(next)
  }


  //{toggleElement("Hide action menu while moving camera")}
  return <>
    <h2 className="text-xs font-bold uppercase mb-6">Display Settings</h2>
    {toggleElement("Show hidden object with ghost effect", props.settings.useIsolationMaterial, onGhostTgl)}
    {toggleElement("Show inspector pane by default", props.settings.showInspectorOnSelect, onInspectorTgl)}
    {toggleElement("Show ground plane", props.settings.showGroundPlane, onGroundPlaneTgl)}
  </>
}