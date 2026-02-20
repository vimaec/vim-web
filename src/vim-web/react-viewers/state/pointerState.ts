import { useEffect, useState } from 'react'
import * as Core from '../../core-viewers'

export function getPointerState (viewer: Core.Webgl.WebglCoreViewer) {
  const [mode, setMode] = useState<Core.PointerMode>(viewer.inputs.pointerMode)

  useEffect(() => {
    const sub = viewer.inputs.onPointerModeChanged.subscribe(() => {
      setMode(viewer.inputs.pointerMode)
    })
    return () => sub()
  }, [])

  const onModeBtn = (target: Core.PointerMode) => {
    viewer.inputs.pointerMode = target
    setMode(target)
  }

  return {
    mode,
    setMode,
    onButton: onModeBtn
  }
}
