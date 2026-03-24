/**
 * @module viw-webgl-react
 */

import React, { useEffect, useRef } from 'react'
import * as Core from '../../core-viewers'
import { SideState } from '../state/sideState'
import { Enable, Resizable } from 're-resizable'
import { Container } from '../container'

const MAX_WIDTH = 0.75

/**
 * Memoized version of the SidePanel.
 */
export const SidePanelMemo = React.memo(SidePanel)

/**
 * JSX Component for collapsible and resizable side panel.
 */
export function SidePanel (props: {
  container: Container
  side: SideState
  viewer: Core.Webgl.Viewer | Core.Ultra.Viewer
  content: () => JSX.Element
}) {
  const resizeTimeOut = useRef<number>()

  // state to force re-render on resize
  const resizeGfx = () => {
    if (props.side.getContent() !== 'none') {
      const width = props.side.getWidth()
      props.container.gfx.style.left = `${width}px`
    } else {
      props.container.gfx.style.left = '0px'
    }

    props.viewer.viewport.resizeToParent()
  }

  const getMaxSize = () => {
    return props.container.root.clientWidth * MAX_WIDTH
  }

  const updateSize = () => {
    let width = props.side.getWidth()
    if (width === 0) return
    width = Math.min(width, getMaxSize())
    width = Math.max(width, props.side.minWidth)
    props.side.setWidth(width)
  }

  // Resize canvas on each re-render.
  useEffect(() => {
    resizeGfx()
  })

  useEffect(() => {
    // Init size to parent
    const obs = new ResizeObserver((entries) => {
      updateSize()
      clearTimeout(resizeTimeOut.current)
      resizeTimeOut.current = window.setTimeout(() => {
        resizeGfx()
      }, 100)
    })
    obs.observe(props.container.root)
  }, [])

  const onNavBtn = () => {
    props.side.popContent()
  }

  return (
    <Resizable
      enable={
        {
          right: true,
          top: false,
          topLeft: false,
          topRight: false,
          left: false,
          bottom: false,
          bottomLeft: false,
          bottomRight: false
        } as Enable
      }
      size={{ width: props.side.getWidth(), height: '100%' }}
      minWidth={props.side.minWidth}
      maxWidth={getMaxSize()}
      onResizeStart={(e, direction, ref) => {
        if (direction !== 'right') {
          e.stopPropagation()
        }
      }}
      onResize={(e, direction, ref, d) => {
        if (direction !== 'right') {
          e.stopPropagation()
        }
        props.side.setWidth(ref.clientWidth)
      }}
      style={{
        position: 'absolute'
      }}
      className='vim-side-panel'
      data-hidden={props.side.getContent() === 'none' || undefined}
    >
      <button
        className="vim-side-panel-nav"
        data-tip="Close panel"
        onClick={onNavBtn}
      />
      <div className='vim-side-panel-content'>
        {props.content()}
      </div>
    </Resizable>
  )
}
