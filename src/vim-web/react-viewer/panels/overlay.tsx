/**
 * @module viw-webgl-react
 */

import React, { useEffect, useRef } from 'react'

/** This overlay is designed to go over the viewer canvas to intercept and dispatch events to the viewer canvas.
 * The point is that quickly finding a ui hit avoids the browser hit detection to search through all elements.
 * When the tree view is open with 10+k elements this increases general fps significantly.
 */
export function Overlay (props: { canvas: HTMLCanvasElement }) {
  const overlay = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const relay = (
      evnt: string,
      construct: (s: string, e: Event) => Event,
      preventDefault: boolean = true
    ) => {
      overlay.current?.addEventListener(evnt, (e) => {
        props.canvas.dispatchEvent(construct(evnt, e))
        if (preventDefault) {
          e.preventDefault()
        }
      })
    }

    relay('mousedown', (s, e) => new MouseEvent(s, e))
    relay('mousemove', (s, e) => new MouseEvent(s, e))
    relay('mouseup', (s, e) => new MouseEvent(s, e))

    relay('dblclick', (s, e) => new MouseEvent(s, e))
    relay('mouseout', (s, e) => new MouseEvent(s, e))
    relay('wheel', (s, e) => new WheelEvent(s, e))

    relay('pointerdown', (s, e) => new PointerEvent(s, e), false)
    relay('pointermove', (s, e) => new PointerEvent(s, e), false)
    relay('pointerup', (s, e) => new PointerEvent(s, e), false)

    relay('touchstart', (s, e) => new TouchEvent(s, e), false)
    relay('touchend', (s, e) => new TouchEvent(s, e), false)
    relay('touchmove', (s, e) => new TouchEvent(s, e), false)
  }, [])

  return (
    <div
      ref={overlay}
      onContextMenu={(e) => e.preventDefault()}
      className={'vim-overlay vc-top-0 vc-left-0 vc-z-10 vc-h-full'}
    ></div>
  )
}
