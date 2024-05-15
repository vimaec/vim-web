/**
 * @module public-api
 */

/**
 * Basic HTML structure that the webgl component expects
 */
export type VimComponentContainer = {
  /**
   * Root of the viewer, all component ui should have this as an acestor.
   */
  root: HTMLElement
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
 * @element optional HTML element to use as root
 * @styling whether to apply default fullscreen styling to the container. Default is true.
 */
export function createContainer (element?: HTMLElement, styling: boolean = true): VimComponentContainer {
  // fullscreen root
  const root = element ?? document.createElement('div')
  root.className += ' vim-component' +
    (styling ? ' vc-absolute vc-top-0 vc-left-0 vc-h-full vc-w-full' : '')

  // container for viewer canvases
  const gfx = document.createElement('div')
  gfx.className = 'vim-gfx' +
    (styling ? ' vc-absolute vc-top-0 vc-left-0 vc-h-full vc-w-full' : '')

  // container for ui
  const ui = document.createElement('div')
  ui.className = 'vim-ui' +
    (styling ? 'vc-top-0 vc-left-0 vc-h-full vc-w-full' : '')

  root.append(gfx)
  root.append(ui)
  document.body.append(root)

  return { root, ui, gfx }
}
