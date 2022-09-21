import React, { useEffect, useState } from 'react'
import * as VIM from 'vim-webgl-viewer/'

export function SidePanel (props: {
  viewer: VIM.Viewer
  content: () => JSX.Element
}) {
  const [visible, setVisible] = useState(false)
  const content = props.content()
  if (!!content !== visible) setVisible(!!content)

  // Resize canvas when panel opens/closes.
  useEffect(() => {
    props.viewer.viewport.canvas.focus()
    resizeCanvas(props.viewer, visible)
  }, [visible])

  if (!visible) return null
  return (
    <div className="vim-bim-panel fixed left-0 top-0 bg-gray-lightest p-6 text-gray-darker h-full">
      {props.content()}
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
