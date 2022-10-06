import { useRef, useState } from 'react'

export type SideContent = 'none' | 'bim' | 'settings'

export type SideState = {
  toggle: (content: SideContent) => void
  pop: () => void
  getNav: () => 'back' | 'close'
  get: () => SideContent
  set: (value: SideContent) => void
}

export function useSideState (useInspector: boolean): SideState {
  const [side, setSide] = useState<SideContent[]>(['bim'])
  const sideRef = useRef(side)

  const toggle = (content: SideContent) => {
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
  const pop = () => {
    sideRef.current.pop()
    setSide([...sideRef.current])
  }
  const getNav = () => {
    return sideRef.current.length > 1 ? 'back' : 'close'
  }

  const get = () => {
    const result = sideRef.current[sideRef.current.length - 1] ?? 'none'
    if (result && !useInspector) return 'none'
    return result
  }

  const set = (value: SideContent) => {
    sideRef.current = [value]
    setSide([value])
  }

  return { set, get, toggle, pop, getNav }
}
