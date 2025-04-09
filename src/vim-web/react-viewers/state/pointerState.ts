import { useEffect, useState } from 'react'
import * as Core from '../../core-viewers'

export function getPointerState (viewer: Core.Webgl.Viewer) {
  const [mode, setMode] = useState<Core.Shared.PointerMode>(viewer.inputs.pointerActive)

  useEffect(() => {
    const sub = viewer.inputs.onPointerModeChanged.subscribe(() => {
      setMode(viewer.inputs.pointerActive)
    })
    return () => sub()
  }, [])

  const onModeBtn = (target: Core.Shared.PointerMode) => {
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
