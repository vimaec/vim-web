
import React, { useEffect, useRef, useState } from 'react'
import ReactTooltip from 'react-tooltip'
import { SideState } from '../state/sideState'

export function RestOfScreen (props:{
  side: SideState,
  content: () => JSX.Element
}) {
  const [, setVersion] = useState(0)
  const resizeObserver = useRef<ResizeObserver>()

  // On Each Render
  useEffect(() => {
    ReactTooltip.rebuild()
  })

  useEffect(() => {
    resizeObserver.current = new ResizeObserver(() => {
      setVersion((prev) => prev ^ 1)
    })
    resizeObserver.current.observe(document.body)

    return () => {
      resizeObserver.current?.disconnect()
    }
  }, [])

  return (
    <div className='vim-rest-of-screen' style={{
      left: props.side.getWidth(),
      width: `calc(100% - ${props.side.getWidth()}px)`
    }}>
      {props.content()}
    </div>)
}
