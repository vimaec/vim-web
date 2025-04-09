/**
 * @module viw-webgl-react
 */

import { useEffect } from 'react'
import ReactTooltip from 'react-tooltip'
import { createSection, IControlBarSection } from './controlBarSection'




/**
 * A map function that changes the context menu.
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
    <div
      style={{
        gap: 'min(10px, 2%)',
        bottom: 'min(36px, 10%)'
      }}
      id='vim-control-bar'
      className='vim-control-bar vc-pointer-events-auto vc-flex-wrap vc-mx-2 vc-min-w-0 vc-absolute vc-left-0 vc-right-0 vc-z-20 vc-flex vc-items-center vc-justify-center transition-all'
    >
      {props.content.map(createSection)}
    </div>
  )
}

