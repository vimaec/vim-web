/**
 * @module viw-webgl-react
 */

import { useEffect } from 'react'
import ReactTooltip from 'react-tooltip'
import { createSection, IControlBarSection } from './controlBarSection'

/**
 * Reference to manage control bar functionality in the viewer.
 */
export type ControlBarApi = {
  /**
   * Defines a callback function to dynamically customize the control bar.
   * @param customization The configuration object specifying the customization options for the control bar.
   */
  customize: (customization: ControlBarCustomization) => void
}

/**
 * A map function that customizes the control bar sections.
 */
export type ControlBarCustomization = (
  e: IControlBarSection[]
) => IControlBarSection[]


/**
 * JSX Component for the control bar.
 */
export function ControlBar (props : { content: IControlBarSection[], show: boolean })
{
  // On Each Render
  useEffect(() => {
    ReactTooltip.rebuild()
  })

  if (!props.show) {
    return null
  }

  return (
    <div id='vim-control-bar' className='vim-control-bar'>
      {props.content.map(createSection)}
    </div>
  )
}
