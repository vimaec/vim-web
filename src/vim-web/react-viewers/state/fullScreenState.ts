import { useEffect, useState, useRef } from 'react'
import { FullScreenObserver } from '../helpers/fullScreenObserver'

export function getFullScreenState () {
  const fullScreenRef = useRef(new FullScreenObserver())
  const isFullScren = () => fullScreenRef.current.isFullScreen()
  const [, setFullScreen] = useState<boolean>(isFullScren())
  useEffect(() => {
    fullScreenRef.current.onFullScreenChange = (value) => setFullScreen(value)

    // Clean up
    return () => fullScreenRef.current.dispose()
  }, [])

  return {
    get: () => isFullScren(),
    toggle: () => {
      if (isFullScren()) {
        document.exitFullscreen()
      } else {
        document.body.requestFullscreen()
      }
    }
  }
}
