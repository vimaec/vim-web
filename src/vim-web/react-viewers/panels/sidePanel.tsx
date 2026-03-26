/**
 * @module viw-webgl-react
 */

import React, { useCallback, useEffect, useRef } from 'react'
import * as Core from '../../core-viewers'
import { SideState } from '../state/sideState'
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
  content: () => React.ReactElement
}) {
  const resizeTimeOut = useRef<number>(undefined)
  const panelRef = useRef<HTMLDivElement>(null)

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

  // Resize canvas when side panel width or visibility changes.
  useEffect(() => {
    resizeGfx()
  }, [props.side.getWidth(), props.side.getContent()])

  useEffect(() => {
    const obs = new ResizeObserver(() => {
      updateSize()
      clearTimeout(resizeTimeOut.current)
      resizeTimeOut.current = window.setTimeout(() => {
        resizeGfx()
      }, 100)
    })
    obs.observe(props.container.root)
    return () => obs.disconnect()
  }, [])

  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = props.side.getWidth()

    const onMove = (e: MouseEvent) => {
      const delta = e.clientX - startX
      const width = Math.max(props.side.minWidth, Math.min(startWidth + delta, getMaxSize()))
      props.side.setWidth(width)
    }

    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [])

  return (
    <div
      ref={panelRef}
      className='vim-side-panel'
      style={{ position: 'absolute', width: props.side.getWidth(), height: '100%' }}
      data-hidden={props.side.getContent() === 'none' || undefined}
    >
      <div className="vim-side-panel-handle" onMouseDown={onDragStart} />
      <button
        className="vim-side-panel-nav"
        data-tip="Close panel"
        onClick={() => props.side.popContent()}
      />
      <div className='vim-side-panel-content'>
        {props.content()}
      </div>
    </div>
  )
}
