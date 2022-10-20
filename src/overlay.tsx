import React, { useEffect, useRef } from 'react'
import * as VIM from 'vim-webgl-viewer/'
import { SideState } from './sidePanel/sideState'

/** This overlay is designed to go over the viewer canvas to intercept and dispatch events to the viewer canvas.
 * The point is that quickly finding a ui hit avoids the browser hit detection to search through all elements.
 * When the tree view is open with 10+k elements this increases general fps significantly.
 */
export function Overlay (props: { viewer: VIM.Viewer; side: SideState }) {
  const overlay = useRef<HTMLDivElement>(null)

  useEffect(() => {
    overlay.current?.addEventListener('mousedown', (e) => {
      props.viewer.viewport.canvas.dispatchEvent(new MouseEvent('mousedown', e))
      e.stopImmediatePropagation()
    })

    overlay.current?.addEventListener('mouseup', (e) => {
      props.viewer.viewport.canvas.dispatchEvent(
        new MouseEvent('mouseup', new MouseEvent('mousedown', e))
      )
      e.stopImmediatePropagation()
      e.preventDefault()
    })

    overlay.current?.addEventListener('mousemove', (e) => {
      props.viewer.viewport.canvas.dispatchEvent(new MouseEvent('mousemove', e))
      e.stopImmediatePropagation()
      e.preventDefault()
    })

    overlay.current?.addEventListener('wheel', (e) => {
      props.viewer.viewport.canvas.dispatchEvent(new WheelEvent('wheel', e))
      e.stopImmediatePropagation()
      e.preventDefault()
    })

    overlay.current?.addEventListener('dblclick', (e) => {
      props.viewer.viewport.canvas.dispatchEvent(new MouseEvent('dblclick', e))
      e.stopImmediatePropagation()
      e.preventDefault()
    })

    overlay.current?.addEventListener('mouseout', (e) => {
      props.viewer.viewport.canvas.dispatchEvent(new MouseEvent('mouseout', e))
      e.stopImmediatePropagation()
      e.preventDefault()
    })
  }, [])

  return (
    <div
      ref={overlay}
      onContextMenu={(e) => e.preventDefault()}
      className={`vim-overlay absolute top-0 h-full w-full z-10 ${
        props.side.get() !== 'none' ? 'bim-panel-open' : ''
      }`}
    ></div>
  )
}
