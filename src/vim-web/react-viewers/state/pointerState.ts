import { useState } from 'react'
import * as Core from '../../core-viewers'
import { useSubscribe } from '../helpers/reactUtils'

export function getPointerState (viewer: Core.Webgl.Viewer) {
  const [mode, setMode] = useState<Core.PointerMode>(viewer.inputs.pointerMode)

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
