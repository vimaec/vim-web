import React, { useRef } from 'react'
import { useWebglViewerWithResidence } from './webglPageUtils'
import * as VIM from '../../vim-web'

export function CustomizeGenericPanel () {
  const div = useRef<HTMLDivElement>(null)

  useWebglViewerWithResidence(div, (viewer, vim) =>{

    // Open isolation panel
    viewer.isolation.showPanel.set(true)

    // Create a new state for the demo
    const state = new VIM.React.ReactUtils.MutableState(true)
    state.onChange.sub(() => {console.log("hello! : " + state.get())})

    viewer.isolationPanel.customize((bar) => {
      // modify an item in the panel
      const item = bar.find((b) => b.id === VIM.React.SectionBoxPanel.Ids.showGhost)
      item.label += " (custom)"

      // Remove an item from the panel
      bar = bar.filter((b) => b.id !== VIM.React.SectionBoxPanel.Ids.ghostOpacity)

      // Add a new item to the panel
      bar.push({
        type: "bool",
        id: VIM.React.SectionBoxPanel.Ids.ghostOpacity,
        label: "CUSTOM BUTTON",
        state: state,
        enabled: () => true,
      })
      return bar
      }
    )
  })

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}
