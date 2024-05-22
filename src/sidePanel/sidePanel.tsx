/**
 * @module viw-webgl-component
 */

import React, { useEffect, useRef } from 'react'
import * as VIM from 'vim-webgl-viewer/'
import * as Icons from '../panels/icons'
import { SideState } from './sideState'
import { Enable, Resizable } from 're-resizable'
import { VimComponentContainer } from '../container'

const MAX_WIDTH = 0.5

/**
 * Memoized version of the SidePanel.
 */
export const SidePanelMemo = React.memo(SidePanel)

/**
 * JSX Component for collapsible and resizable side panel.
 */
export function SidePanel (props: {
  container: VimComponentContainer
  side: SideState
  viewer: VIM.Viewer
  content: () => JSX.Element
}) {
  const resizeTimeOut = useRef<number>()

  // state to force re-render on resize
  const resizeGfx = () => {
    if (props.side.getContent() !== 'none') {
      const width = props.side.getWidth()
      const full = props.container.root.clientWidth
      props.container.gfx.style.width = `${full - width}px`
      props.container.gfx.style.marginLeft = `${width}px`
    } else {
      props.container.gfx.style.width = '100%'
      props.container.gfx.style.marginLeft = '0px'
    }

    props.viewer.viewport.ResizeToParent()
  }

  const getMaxSize = () => {
    return props.container.root.clientWidth * MAX_WIDTH
  }

  const getClampedSize = () => {
    const next = Math.min(props.side.getWidth(), getMaxSize())
    return Math.max(next, props.side.minWidth)
  }

  // Resize canvas on each re-render.
  useEffect(() => {
    resizeGfx()
  })

  useEffect(() => {
    // Init size to parent
    props.side.setWidth(getClampedSize())
    const obs = new ResizeObserver((entries) => {
      props.side.setWidth(getClampedSize())
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

  const iconOptions = { height: 20, width: 20, fill: 'currentColor' }
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
      className={`vim-side-panel vc-top-0 vc-left-0 vc-z-20 vc-bg-gray-lightest vc-p-6 vc-text-gray-darker ${
        props.side.getContent() !== 'none' ? '' : 'vc-hidden'
      }`}
    >
      <button
        className="vim-side-panel-nav vc-absolute vc-right-6 vc-top-6 vc-text-gray-medium"
        onClick={onNavBtn}
      >
        {Icons.close(iconOptions)}
      </button>
      {props.content()}
    </Resizable>
  )
}
