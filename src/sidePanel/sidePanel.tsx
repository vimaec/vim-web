import React, { useEffect } from 'react'
import * as VIM from 'vim-webgl-viewer/'
import * as Icons from '../icons'
import { SideState } from './sideState'
import { Resizable } from 're-resizable'

export const SidePanel = React.memo(_SidePanel)
export function _SidePanel (props: {
  side: SideState
  viewer: VIM.Viewer
  content: JSX.Element
}) {
  // Resize canvas when panel opens/closes.
  useEffect(() => {
    props.viewer.viewport.canvas.focus()
    resizeCanvas(
      props.viewer,
      props.side.getContent() !== 'none',
      props.side.getWidth()
    )
    props.viewer.viewport.ResizeToParent()
  })

  const onNavBtn = () => {
    props.side.popContent()
  }

  const iconOptions = { height: '20', width: '20', fill: 'currentColor' }
  return (
    <Resizable
      onResizeStop={(e, direction, ref, d) => {
        props.side.setWidth(ref.clientWidth)
        console.log(ref.clientWidth)
      }}
      defaultSize={{ width: props.side.getWidth(), height: '100%' }}
      minWidth={240}
      maxWidth={'50%'}
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
  console.log('RESIZE')
  console.log(visible)
  console.log(width)
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
