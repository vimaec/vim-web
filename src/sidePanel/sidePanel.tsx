import React, { useEffect, useState } from 'react'
import * as VIM from 'vim-webgl-viewer/'
import * as Icons from '../icons'
import { SideState } from './sideState'
import { Resizable } from 're-resizable'

const MAX_WIDTH = 0.5
const MIN_WIDTH = 240

export const SidePanel = React.memo(_SidePanel)
export function _SidePanel (props: {
  side: SideState
  viewer: VIM.Viewer
  content: JSX.Element
}) {
  const getParentWidth = () => {
    const parent = props.viewer.viewport.canvas.parentElement
    return parent.parentElement.clientWidth
  }

  // state to force re-render on resize
  const [, setParentWidth] = useState(getParentWidth())

  const resize = () => {
    resizeCanvas(
      props.viewer,
      props.side.getContent() !== 'none',
      props.side.getWidth()
    )
    props.viewer.viewport.ResizeToParent()
  }

  const getMaxSize = () => {
    return getParentWidth() * MAX_WIDTH
  }

  const getClampedSize = () => {
    const next = Math.min(props.side.getWidth(), getMaxSize())
    return Math.max(next, MIN_WIDTH)
  }

  // Resize canvas on each re-render.
  useEffect(() => {
    resize()
  })

  useEffect(() => {
    window.addEventListener('resize', () => {
      setParentWidth((w) => getParentWidth())
      props.side.setWidth(getClampedSize())
    })
  }, [])

  const onNavBtn = () => {
    props.side.popContent()
  }

  const iconOptions = { height: '20', width: '20', fill: 'currentColor' }
  return (
    <Resizable
      size={{ width: props.side.getWidth(), height: '100%' }}
      minWidth={240}
      maxWidth={getMaxSize()}
      onResize={(e, direction, ref, d) => {
        props.side.setWidth(ref.clientWidth)
      }}
      style={{
        position: 'fixed'
      }}
      className={`vim-side-panel-test left-0 top-0 bg-gray-lightest p-6 text-gray-darker z-20 ${
        props.side.getContent() !== 'none' ? '' : 'hidden'
      }`}
    >
      <button
        className="vim-side-panel-nav text-gray-medium absolute right-6 top-6"
        onClick={onNavBtn}
      >
        {Icons.close(iconOptions)}
      </button>
      {props.content}
    </Resizable>
  )
}

function resizeCanvas (viewer: VIM.Viewer, visible: boolean, width: number) {
  const parent = viewer.viewport.canvas.parentElement
  const full = parent.parentElement.clientWidth

  if (visible) {
    parent.style.width = `${full - width}px`
    parent.style.marginLeft = `${width}px`
  } else {
    parent.style.width = '100%'
    parent.style.marginLeft = '0px'
  }
}
