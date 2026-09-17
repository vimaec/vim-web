import { SimpleEventDispatcher } from 'ste-simple-events'
import type * as Core from '../../core-viewers'
import type { ISimpleEvent } from '../../core-viewers/shared/events'
// Plain helpers; they move into this layer at the flip.
import { type CursorManager, pointerToCursor } from '../../react-viewers/helpers/cursor'
import { FullScreenObserver } from '../../react-viewers/helpers/fullScreenObserver'

/**
 * Small tool states behind control bar buttons — the twins of
 * `getPointerState`, `getFullScreenState` and `getMeasureState`. Each
 * exposes `onChange` so the bar can re-sync instead of re-rendering.
 */

export type PointerState = {
  getMode (): Core.PointerMode
  set (mode: Core.PointerMode): void
  onChange: ISimpleEvent<void>
  destroy (): void
}

export function createPointerState (viewer: Core.Webgl.Viewer, defaultMode?: Core.PointerMode): PointerState {
  if (defaultMode !== undefined) viewer.inputs.pointerMode = defaultMode
  const changed = new SimpleEventDispatcher<void>()
  const unsubscribe = viewer.inputs.onPointerModeChanged.subscribe(() => changed.dispatch())
  return {
    getMode: () => viewer.inputs.pointerMode,
    set: mode => {
      viewer.inputs.pointerMode = mode
      changed.dispatch()
    },
    onChange: changed.asEvent(),
    destroy: unsubscribe
  }
}

export type FullScreenState = {
  get (): boolean
  toggle (): void
  onChange: ISimpleEvent<void>
  destroy (): void
}

export function createFullScreenState (): FullScreenState {
  const observer = new FullScreenObserver()
  const changed = new SimpleEventDispatcher<void>()
  observer.onFullScreenChange = () => changed.dispatch()
  return {
    get: () => observer.isFullScreen(),
    toggle: () => {
      if (observer.isFullScreen()) document.exitFullscreen()
      else document.body.requestFullscreen()
    },
    onChange: changed.asEvent(),
    destroy: () => observer.dispose()
  }
}

export type MeasureState = {
  isActive (): boolean
  toggle (): void
  clear (): void
  onChange: ISimpleEvent<void>
}

/** Measuring mode: the gizmo restarts after each measurement until toggled off. */
export function createMeasureState (viewer: Core.Webgl.Viewer, cursor: CursorManager): MeasureState {
  let active = false
  const changed = new SimpleEventDispatcher<void>()

  const loop = () => {
    cursor.setCursor('cursor-measure')
    viewer.gizmos.measure
      .start()
      .catch(() => undefined)
      .finally(() => {
        cursor.setCursor(pointerToCursor(viewer.inputs.pointerMode))
        if (active) loop()
        else viewer.gizmos.measure.clear()
      })
  }

  const toggle = () => {
    if (active) {
      viewer.gizmos.measure.abort()
      active = false
    } else {
      active = true
      loop()
    }
    changed.dispatch()
  }

  return {
    isActive: () => active,
    toggle,
    clear: () => {
      viewer.gizmos.measure.abort()
      toggle()
    },
    onChange: changed.asEvent()
  }
}
