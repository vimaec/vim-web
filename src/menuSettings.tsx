import React, { useEffect, useRef } from "react";
import { useState } from 'react'
import * as VIM from 'vim-webgl-viewer/'


export function MenuSettings(props: { viewer: VIM.Viewer})
{
  const toggleElement = (label: string) =>{
    return <span className="vim-settings-line block">
      <input type="checkbox"></input>
      <span className="text-gray-medium m-1 w-max py-1">{label} </span>
    </span>
  }

  return <>
    <h2 className="text-xs font-bold uppercase mb-6">Display Settings</h2>
    {toggleElement("Show performance gizmo")}
    {toggleElement("Show hidden object with ghost effect")}
    {toggleElement("Show inspector pane by default")}
    {toggleElement("Hide action menu while moving camera")}
    {toggleElement("Show ground plane")}
  </>
}