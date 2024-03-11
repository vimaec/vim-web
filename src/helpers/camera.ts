/**
 * @module viw-webgl-component
 */

import * as VIM from 'vim-webgl-viewer/'

/**
 * Wraps the webgl viewer and provide higher level methods
 */
export class ComponentCamera {
  private _viewer: VIM.Viewer
  constructor (viewer: VIM.Viewer) {
    this._viewer = viewer
  }
  
  /**
   * Resets the camera to its initial position.
   */
  reset () {
    this._viewer.camera.lerp(1).reset()
  }

  /**
   * Frames selected elements if there is an active selection; otherwise, frames all visible objects.
   * @param duration Optional duration of the camera movement animation (default: 1).
   */
  frameContext (duration = 1) {
    if (this._viewer.selection.count > 0) {
      this.frameSelection(duration)
    } else {
      this.frameVisibleObjects(undefined, duration)
    }
  }

  /**
   * Frames selected elements if there is an active selection; otherwise, does nothing.
   * @param duration Optional duration of the camera movement animation (default: 1).
   */
  frameSelection (duration = 1) {
    if (this._viewer.selection.count === 0) return
    const box = this._viewer.selection.getBoundingBox()

    if (box && this._viewer.gizmos.section.box.intersectsBox(box)) {
      var movement = duration === 0
        ? this._viewer.camera.snap()
        : this._viewer.camera.lerp(duration)
      movement.frame(box)
    }
  }

/**
 * Frames all visible objects in the scene.
 * @param source Optional VIM to specify the source of objects to frame.
 * @param duration Duration of the camera movement animation (default: 1).
 */
  frameVisibleObjects (source?: VIM.Vim, duration = 1) {
    var movement = duration === 0
      ? this._viewer.camera.snap()
      : this._viewer.camera.lerp(duration)

    const box = this.getVisibleBoundingBox(source)
    movement.frame(box)
  }

  /**
   * Returns the bounding box of all visible objects.
   * @param source Optional VIM to specify the source of visible objects.
   * @returns The bounding box of all visible objects.
   */
  getVisibleBoundingBox (source?: VIM.Vim) {
    let box: THREE.Box3

    const vimBoxUnion = (vim: VIM.Vim) => {
      for (const obj of vim.getObjects()) {
        if (!obj.visible) continue
        const b = obj.getBoundingBox()
        if (!b) continue
        box = box ? box.union(b) : b?.clone()
      }
    }
    if (source) {
      vimBoxUnion(source)
    } else {
      for (const vim of this._viewer.vims) {
        vimBoxUnion(vim)
      }
    }

    return box
  }
}
