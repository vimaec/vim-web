import { useState, useEffect } from 'react'
import * as Core from '../../core-viewers'
import { useSubscribe } from '../helpers/reactUtils'

export function getPointerState (viewer: Core.Webgl.Viewer, defaultMode?: Core.PointerMode) {
  const [mode, setMode] = useState<Core.PointerMode>(defaultMode ?? viewer.inputs.pointerMode)

  useEffect(() => {
    if (defaultMode !== undefined) viewer.inputs.pointerMode = defaultMode
  }, [])

  useSubscribe(viewer.inputs.onPointerModeChanged, () => setMode(viewer.inputs.pointerMode))

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
