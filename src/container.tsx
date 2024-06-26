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
 * The element is created if not provided. The element will be made position:absolute.
 * @element optional HTML element to use as root
 */
export function createContainer (element?: HTMLElement): VimComponentContainer {
  // fullscreen root
  let root = element
  if (root === undefined) {
    root = document.createElement('div')
    document.body.append(root)
    root.classList.add('vc-inset-0')
  }
  // UI relies on absolute positioning
  root.style.position = 'absolute'
  root.classList.add('vim-component')

  // container for viewer canvases
  const gfx = document.createElement('div')
  gfx.className = 'vim-gfx vc-absolute vc-inset-0'

  // container for ui
  const ui = document.createElement('div')
  ui.className = 'vim-ui vc-absolute vc-inset-0'

  root.append(gfx)
  root.append(ui)

  return { root, ui, gfx }
}
