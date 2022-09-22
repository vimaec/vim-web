import React, { useEffect } from 'react'
import * as VIM from 'vim-webgl-viewer/'
import * as Icons from './icons'

export function SidePanel (props: {
  visible: boolean
  viewer: VIM.Viewer
  content: JSX.Element
  popSide: () => void
  getSideNav: () => 'back' | 'close'
}) {
  // Resize canvas when panel opens/closes.
  useEffect(() => {
    props.viewer.viewport.canvas.focus()
    resizeCanvas(props.viewer, props.visible)
  })

  const onNavBtn = () => {
    props.popSide()
  }

  const iconOptions = { height: '20', width: '20', fill: 'currentColor' }
  return (
    <div
      className={`vim-side-panel fixed left-0 top-0 bg-gray-lightest p-6 text-gray-darker h-full ${
        props.visible ? '' : 'hidden'
      }`}
    >
      <button
        className="vim-side-panel-nav absolute right-2 top-2"
        onClick={onNavBtn}
      >
        {props.getSideNav() === 'back'
          ? Icons.arrowLeft(iconOptions)
          : Icons.close(iconOptions)}
      </button>
      {props.content}
    </div>
  )
}

function resizeCanvas (viewer: VIM.Viewer, open: boolean) {
  const parent = viewer.viewport.canvas.parentElement
  const previous = parent.className
  parent.className = parent.className.replace(' bim-panel-open', '')
  parent.className += open ? ' bim-panel-open' : ''
  if (previous !== parent.className) {
    viewer.viewport.ResizeToParent()
  }
}
