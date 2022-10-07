import * as VIM from 'vim-webgl-viewer/'

/**
 * Wraps the webgl viewer and provide higher level methods
 */
export class ViewerWrapper {
  base: VIM.Viewer
  constructor (viewer: VIM.Viewer) {
    this.base = viewer
  }

  /**
   * Reset camera to initial position
   */
  resetCamera () {
    this.base.camera.reset()
    this.base.camera.frame('all', 45)
  }

  /**
   * Make camera frame selection if any otherwise frame visible objects
   */
  frameContext () {
    if (this.base.selection.count > 0) {
      this.frameSelection()
    } else {
      this.frameVisibleObjects()
    }
  }

  /**
   * Make camera frame selection
   */
  frameSelection () {
    if (this.base.selection.count === 0) return
    const box = this.base.selection.getBoundingBox()

    if (box && this.base.sectionBox.box.intersectsBox(box)) {
      this.base.camera.frame(box, 'none', this.base.camera.defaultLerpDuration)
    }
  }

  /**
   * Makes camera frame all visible objects
   */
  frameVisibleObjects (source?: VIM.Vim) {
    this.base.camera.frame(
      this.getVisibleBoundingBox(source),
      'none',
      this.base.camera.defaultLerpDuration
    )
  }

  /**
   * Returns true if all objects are visible
   * @param source if defined will only look at object in given vim, otherwise in all vims.
   */
  areAllObjectsVisible (source?: VIM.Vim) {
    const vimAllVisible = (vim: VIM.Vim) => {
      for (const obj of vim.getAllObjects()) {
        if (!obj.visible) return false
      }
      return true
    }
    if (source) {
      return vimAllVisible(source)
    } else {
      for (const vim of this.base.vims) {
        if (!vimAllVisible(vim)) return false
      }
      return true
    }
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
      for (const vim of this.base.vims) {
        vimBoxUnion(vim)
      }
    }

    return box
  }
}
