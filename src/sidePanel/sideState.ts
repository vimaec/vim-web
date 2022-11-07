import { useMemo, useRef, useState } from 'react'

export type SideContent = 'none' | 'bim' | 'settings'

export type SideState = {
  toggleContent: (content: SideContent) => void
  popContent: () => void
  getNav: () => 'back' | 'close'
  getContent: () => SideContent
  setContent: (value: SideContent) => void
  getWidth: () => number
  setWidth: (value: number) => void
}

export function useSideState (
  useInspector: boolean,
  defaultWidth: number
): SideState {
  const [side, setSide] = useState<SideContent[]>(['bim'])
  const [width, setWidth] = useState<number>(defaultWidth)
  const sideRef = useRef(side)

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
    if (result === 'bim' && !useInspector) return 'none'
    return result
  }

  const setContent = (value: SideContent) => {
    sideRef.current = [value]
    setSide([value])
  }

  return useMemo(
    () => ({
      setContent,
      getContent,
      toggleContent,
      popContent,
      getNav,
      getWidth: () => width,
      setWidth
    }),
    [side, width]
  )
}
