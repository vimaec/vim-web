/**
 * @module viw-webgl-component
 */

import * as VIM from 'vim-webgl-viewer/'

/**
 * Wraps the webgl viewer and provide higher level methods
 */
export class ViewerWrapper {
  viewer: VIM.Viewer
  constructor (viewer: VIM.Viewer) {
    this.viewer = viewer
  }

  /**
   * Reset camera to initial position
   */
  resetCamera () {
    this.viewer.camera.reset()
    this.viewer.camera.frame('all', 45)
  }

  /**
   * Make camera frame selection if any otherwise frame visible objects
   */
  frameContext () {
    if (this.viewer.selection.count > 0) {
      this.frameSelection()
    } else {
      this.frameVisibleObjects()
    }
  }

  /**
   * Make camera frame selection, if no selection does nothing.
   */
  frameSelection () {
    if (this.viewer.selection.count === 0) return
    const box = this.viewer.selection.getBoundingBox()

    if (box && this.viewer.sectionBox.box.intersectsBox(box)) {
      this.viewer.camera.frame(
        box,
        'none',
        this.viewer.camera.defaultLerpDuration
      )
    }
  }

  /**
   * Makes camera frame all visible objects
   */
  frameVisibleObjects (source?: VIM.Vim) {
    this.viewer.camera.frame(
      this.getVisibleBoundingBox(source),
      'none',
      this.viewer.camera.defaultLerpDuration
    )
  }

  /**
   * Returns the bounding box of all visible objects
   */
  getVisibleBoundingBox (source?: VIM.Vim) {
    let box: VIM.THREE.Box3

    const vimBoxUnion = (vim: VIM.Vim) => {
      for (const obj of vim.getAllObjects()) {
        if (!obj.visible) continue
        const b = obj.getBoundingBox()
        if (!b) continue
        box = box ? box.union(b) : b?.clone()
      }
    }
    if (source) {
      vimBoxUnion(source)
    } else {
      for (const vim of this.viewer.vims) {
        vimBoxUnion(vim)
      }
    }

    return box
  }
}
