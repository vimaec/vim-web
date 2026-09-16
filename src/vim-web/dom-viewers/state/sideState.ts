import { SimpleEventDispatcher } from 'ste-simple-events'
import type { ISimpleEvent } from '../../core-viewers/shared/events'

export type SideContent = 'none' | 'bim' | 'settings' | 'logs'

const MIN_WIDTH = 160

/**
 * State of the side panel: a two-deep content stack (so "back" can return to
 * the previous page), its width, and whether a BIM model is loaded. The
 * framework-neutral twin of the React `useSideState` closure, plus `onChange`.
 */
export type SideState = {
  minWidth: number
  toggleContent (content: SideContent): void
  popContent (): void
  getNav (): 'back' | 'close'
  getContent (): SideContent
  setContent (content: SideContent): void
  setHasBim (value: boolean): void
  /** 0 while no content is shown. */
  getWidth (): number
  setWidth (value: number): void
  /** Fires after any change (content, width or hasBim). */
  onChange: ISimpleEvent<void>
}

export function createSideState (useInspector: boolean, defaultWidth: number): SideState {
  let stack: SideContent[] = ['bim']
  let width = Math.max(MIN_WIDTH, defaultWidth)
  let hasBim = false
  const changed = new SimpleEventDispatcher<void>()
  const notify = () => changed.dispatch()

  const getContent = (): SideContent => {
    const result = stack[stack.length - 1] ?? 'none'
    if (result === 'bim' && (!useInspector || !hasBim)) return 'none'
    return result
  }

  return {
    minWidth: MIN_WIDTH,
    toggleContent: content => {
      const [a, b] = stack
      if (!a && !b) stack = [content]
      else if (a === content && !b) stack = []
      else if (a !== content && !b) stack = [a, content]
      else if (a && b === content) stack = [a]
      else stack = [content]
      notify()
    },
    popContent: () => {
      stack = stack.slice(0, -1)
      notify()
    },
    getNav: () => stack.length > 1 ? 'back' : 'close',
    getContent,
    setContent: content => {
      stack = [content]
      notify()
    },
    setHasBim: value => {
      hasBim = value
      notify()
    },
    getWidth: () => getContent() === 'none' ? 0 : width,
    setWidth: value => {
      if (value === width) return
      width = value
      notify()
    },
    onChange: changed.asEvent()
  }
}
