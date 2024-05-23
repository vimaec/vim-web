/**
 * @module public-api
 */
import React from 'react'

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
export function createContainer (element?: HTMLElement): VimComponentContainer {
  // fullscreen root
  const root = element ?? document.createElement('div')
  root.classList.add('vim-component')
  if (element === undefined) {
    root.classList.add('vc-absolute', 'vc-inset-0')
  }

  // container for viewer canvases
  const gfx = document.createElement('div')
  gfx.className = 'vim-gfx vc-absolute vc-inset-0'

  // container for ui
  const ui = document.createElement('div')
  ui.className = 'vim-ui vc-absolute vc-inset-0'

  root.append(gfx)
  root.append(ui)
  document.body.append(root)

  return { root, ui, gfx }
}

export function VimContainer (styling: boolean = true) {
  const rootName = ' vim-component' +
    (styling ? ' vc-absolute vc-top-0 vc-left-0 vc-h-full vc-w-full' : '')

  const gfxName = 'vim-gfx' +
    (styling ? ' vc-absolute vc-top-0 vc-left-0 vc-h-full vc-w-full' : '')

  const uiName = 'vim-ui' +
    (styling ? 'vc-top-0 vc-left-0 vc-h-full vc-w-full' : '')

  return <div className={rootName}>
    <div className={gfxName}/>
    <div className={uiName}></div>
  </div>
}
