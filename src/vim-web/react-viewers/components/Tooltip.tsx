import React, { useRef, useState, useEffect, useCallback, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'

const GAP = 6

/**
 * Place once around a container with many [data-tip] elements.
 * Uses event delegation — zero per-item overhead.
 * Tracks mouse position so the tooltip appears at the cursor's current location.
 */
export function TooltipZone({ children, delay = 300 }: {
  children: React.ReactNode
  delay?: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const mouse = useRef({ x: 0, y: 0 })
  const activeTarget = useRef<HTMLElement | null>(null)
  const [tip, setTip] = useState<{ text: string, x: number, top: number, bottom: number } | null>(null)

  const onMove = useCallback((e: MouseEvent) => {
    mouse.current = { x: e.clientX, y: e.clientY }
  }, [])

  const onEnter = useCallback((e: MouseEvent) => {
    const target = (e.target as HTMLElement).closest?.('[data-tip]') as HTMLElement | null
    if (!target || target === activeTarget.current) return
    activeTarget.current = target
    clearTimeout(timer.current)
    mouse.current = { x: e.clientX, y: e.clientY }
    timer.current = setTimeout(() => {
      const text = target.getAttribute('data-tip')
      if (!text) return
      const rect = target.getBoundingClientRect()
      setTip({ text, x: mouse.current.x, top: rect.top, bottom: rect.bottom })
    }, delay)
  }, [delay])

  const onLeave = useCallback((e: MouseEvent) => {
    const related = (e.relatedTarget as HTMLElement)?.closest?.('[data-tip]')
    if (related === activeTarget.current) return
    activeTarget.current = null
    clearTimeout(timer.current)
    setTip(null)
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('mouseover', onEnter)
    el.addEventListener('mouseout', onLeave)
    el.addEventListener('mousemove', onMove)
    return () => {
      clearTimeout(timer.current)
      el.removeEventListener('mouseover', onEnter)
      el.removeEventListener('mouseout', onLeave)
      el.removeEventListener('mousemove', onMove)
    }
  }, [onEnter, onLeave, onMove])

  return (
    <div ref={containerRef} style={{ display: 'contents' }}>
      {children}
      {tip && <TooltipPortal text={tip.text} anchorX={tip.x} anchorTop={tip.top} anchorBottom={tip.bottom} />}
    </div>
  )
}

function TooltipPortal({ text, anchorX, anchorTop, anchorBottom }: {
  text: string, anchorX: number, anchorTop: number, anchorBottom: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number, top: number } | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const w = el.offsetWidth
    const h = el.offsetHeight

    let left = anchorX - w / 2
    left = Math.max(4, Math.min(left, window.innerWidth - w - 4))

    // Above the element; if no room, below the element
    let top = anchorTop - h - GAP
    if (top < 4) top = anchorBottom + GAP

    setPos({ left, top })
  }, [anchorX, anchorTop, anchorBottom, text])

  return createPortal(
    <div
      ref={ref}
      className="vim-tooltip-portal"
      style={pos
        ? { left: pos.left, top: pos.top, visibility: 'visible' }
        : { left: anchorX, top: anchorTop, visibility: 'hidden' }
      }
    >
      {text}
    </div>,
    document.body
  )
}
