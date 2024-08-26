import ReactTooltip from 'react-tooltip'
import { useRef, useState } from 'react'
import * as VIM from 'vim-webgl-viewer/'
import { CursorManager, pointerToCursor } from '../helpers/cursor'

export function getMeasureState (viewer: VIM.Viewer, cursor: CursorManager) {
  const measuringRef = useRef<boolean>(false)
  const activeRef = useRef<boolean>(false)
  const [active, setActive] = useState(measuringRef.current)
  const [, setMeasurement] = useState<VIM.THREE.Vector3>()

  const toggle = () => {
    ReactTooltip.hide()

    if (activeRef.current) {
      viewer.gizmos.measure.abort()
      activeRef.current = false
      setActive(false)
    } else {
      activeRef.current = true
      setActive(true)
      loop()
    }
  }

  const clear = () => {
    ReactTooltip.hide()
    viewer.gizmos.measure.abort()
    toggle()
  }

  /**
 * Behaviour to have measure gizmo loop over and over.
 */
  const loop = () => {
    const onMouseMove = () => {
      setMeasurement(viewer.gizmos.measure.measurement)
    }
    cursor.setCursor('cursor-measure')
    viewer.viewport.canvas.addEventListener('mousemove', onMouseMove)
    viewer.gizmos.measure
      .start()
      .then(() => {
        setMeasurement(viewer.gizmos.measure.measurement)
      })
      .catch(() => {
        setMeasurement(undefined)
      })
      .finally(() => {
        cursor.setCursor(pointerToCursor(viewer.inputs.pointerActive))
        viewer.viewport.canvas.removeEventListener('mousemove', onMouseMove)
        if (activeRef.current) {
          loop()
        } else {
          viewer.gizmos.measure.clear()
        }
      })
  }

  return {
    active,
    toggle,
    clear
  }
}
