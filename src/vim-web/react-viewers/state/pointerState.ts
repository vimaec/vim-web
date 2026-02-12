import { useEffect, useState } from 'react'
import * as Core from '../../core-viewers'

export function getPointerState (viewer: Core.Webgl.Viewer) {
  const [mode, setMode] = useState<Core.PointerMode>(viewer.inputs.pointerActive)

  useEffect(() => {
    const sub = viewer.inputs.onPointerModeChanged.subscribe(() => {
      setMode(viewer.inputs.pointerActive)
    })
    return () => sub()
  }, [])

  const onModeBtn = (target: Core.PointerMode) => {
    viewer.inputs.pointerActive = target
    setMode(target)
  }

  return {
    mode,
    setMode,
    onButton: onModeBtn
  }
}
