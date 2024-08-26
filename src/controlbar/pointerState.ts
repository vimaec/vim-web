import { useEffect, useState } from 'react'
import * as VIM from 'vim-webgl-viewer/'

export function getPointerState (viewer: VIM.Viewer) {
  const [mode, setMode] = useState<VIM.PointerMode>(viewer.inputs.pointerActive)

  useEffect(() => {
    const sub = viewer.inputs.onPointerModeChanged.subscribe(() => {
      setMode(viewer.inputs.pointerActive)
    })
    return () => sub()
  }, [])

  const onModeBtn = (target: VIM.PointerMode) => {
    const next = mode === target ? viewer.inputs.pointerFallback : target
    viewer.inputs.pointerActive = next
    setMode(next)
  }

  return {
    mode,
    setMode,
    onButton: onModeBtn
  }
}
