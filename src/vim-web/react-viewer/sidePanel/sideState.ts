/**
 * @module viw-webgl-react
 */

import { useMemo, useRef, useState } from 'react'

export type SideContent = 'none' | 'bim' | 'settings' | 'logs'
const MIN_WIDTH = 160

export type SideState = {
  minWidth: number
  toggleContent: (content: SideContent) => void
  popContent: () => void
  getNav: () => 'back' | 'close'
  getContent: () => SideContent
  setContent: (value: SideContent) => void
  setHasBim: (value: boolean) => void
  getWidth: () => number
  setWidth: (value: number) => void
}

/**
 * Returns state closure for side panel
 * @param useInspector inspector will only be displayed if this is true.
 * @param defaultWidth default width of the side panel in pixel.
 * @returns
 */
export function useSideState (
  useInspector: boolean,
  defaultWidth: number
): SideState {
  const w = Math.max(MIN_WIDTH, defaultWidth)
  const [side, setSide] = useState<SideContent[]>(['bim'])
  const [, _setHasBim] = useState<boolean>(false)
  const [width, _setWidth] = useState<number>(w)
  const sideRef = useRef(side)
  const widthRef = useRef(w)
  const hasBimRef = useRef(false)

  const toggleContent = (content: SideContent) => {
    let r
    const [A, B] = sideRef.current
    if (!A && !B) r = [content]
    else if (A === content && !B) r = []
    else if (A !== content && !B) r = [A, content]
    else if (A && B === content) r = [A]
    else if (A && B !== content) r = [content]
    sideRef.current = r
    setSide(r)
  }
  const popContent = () => {
    sideRef.current.pop()
    setSide([...sideRef.current])
  }
  const getNav = () => {
    return sideRef.current.length > 1 ? 'back' : 'close'
  }

  const getContent = () => {
    const result = sideRef.current[sideRef.current.length - 1] ?? 'none'
    if (result === 'bim' && (!useInspector || !hasBimRef.current)) return 'none'
    return result
  }

  const setHasBim = (value: boolean) => {
    hasBimRef.current = value
    _setHasBim(value)
  }

  const setContent = (value: SideContent) => {
    sideRef.current = [value]
    setSide([value])
  }

  const setWidth = (value: number) => {
    widthRef.current = value
    _setWidth(value)
  }
  const getWidth = () => {
    return getContent() === 'none' ? 0 : widthRef.current
  }

  return useMemo(
    () => ({
      minWidth: MIN_WIDTH,
      setHasBim,
      setContent,
      getContent,
      toggleContent,
      popContent,
      getNav,
      getWidth,
      setWidth
    } as SideState),
    [side, width]
  )
}
