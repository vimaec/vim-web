import { createToaster } from '../ds'
import type * as Core from '../../core-viewers'

/**
 * Briefly shows the camera move speed whenever it changes. Uses the DS
 * toaster (top-right, on document.body), so the React version's side-panel
 * offset logic is gone.
 */
export function speedToast (viewer: Core.Webgl.Viewer, opts: { timeout?: number } = {}): { destroy (): void } {
  const toaster = createToaster({ timeout: opts.timeout ?? 1000 })
  let speed = viewer.inputs.moveSpeed
  let dismiss: (() => void) | undefined

  const unsubscribe = viewer.inputs.onSettingsChanged.subscribe(() => {
    if (viewer.inputs.moveSpeed === speed) return
    speed = viewer.inputs.moveSpeed
    dismiss?.()
    dismiss = toaster.show({ text: `Speed: ${speed + 25}` })
  })

  return {
    destroy: () => {
      unsubscribe()
      dismiss?.()
      toaster.destroy()
    }
  }
}
