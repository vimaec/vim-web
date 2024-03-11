import * as VIM from 'vim-webgl-viewer/'

/**
 * Basic HTML structure that the webgl component expects
 */
export type VimComponentContainer = {
  /**
   * Root of the viewer, all component ui should have this as an acestor.
   */
  root: HTMLDivElement
  /**
   * Div where to instantiate ui elements.
   */
  ui: HTMLDivElement

  /**
   * Div to hold viewer canvases and ui
   */
  gfx: HTMLDivElement
}

/**
 * Creates a default container for the vim component around a vim viewer
 */
export function createContainer (viewer: VIM.Viewer): VimComponentContainer {
  const root = document.createElement('div')
  root.className =
    'vim-component vc-absolute vc-top-0 vc-left-0 vc-h-full vc-w-full'
  document.body.append(root)

  // container for canvases
  const gfx = document.createElement('div')
  gfx.className = 'vim-gfx vc-absolute vc-top-0 vc-left-0 vc-h-full vc-w-full'

  root.append(gfx)

  gfx.append(viewer.viewport.canvas)
  gfx.append(viewer.viewport.text)
  gfx.append(viewer.gizmos.axes.canvas)

  // container for ui
  const ui = document.createElement('div')
  ui.className = 'vim-ui vc-top-0 vc-left-0 vc-h-full vc-w-full'

  root.append(ui)

  // Initial viewer settings
  viewer.viewport.canvas.tabIndex = 0

  return { root, ui, gfx }
}