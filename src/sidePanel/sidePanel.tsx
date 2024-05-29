/**
 * @module viw-webgl-component
 */

import React, { useEffect, useRef } from 'react'
import * as VIM from 'vim-webgl-viewer/'
import * as Icons from '../panels/icons'
import { SideState } from './sideState'
import { Enable, Resizable } from 're-resizable'
import { VimComponentContainer } from '../container'

const MAX_WIDTH = 0.75

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
      props.container.gfx.style.left = `${width}px`
    } else {
      props.container.gfx.style.left = '0px'
    }

    props.viewer.viewport.ResizeToParent()
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
      className={`vim-side-panel vc-top-0 vc-left-0 vc-z-20 vc-bg-gray-lightest vc-text-gray-darker ${
        props.side.getContent() !== 'none' ? '' : 'vc-hidden'
      }`}
    >
      <button
        className="vim-side-panel-nav vc-z-30 vc-absolute vc-right-1 vc-top-1 vc-w-4 vc-h-4 vc-text-gray-medium"
        onClick={onNavBtn}
      >
        {Icons.close({...iconOptions, className: 'vc-max-h-full vc-max-w-full' })}
      </button>
      <div
       className='vim-side-panel-content vc-absolute vc-top-0 vc-bottom-0'>

        {props.content()}
      </div>
    </Resizable>
  )
}
