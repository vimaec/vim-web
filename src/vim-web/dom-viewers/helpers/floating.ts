/**
 * Positions a floating element relative to an anchor: centred above it, below
 * it when there is no room on top, clamped to the viewport sides.
 * Pure position math, kept separate so it can be unit-tested.
 */
export function computeFloatingPosition (originRect: DOMRect, panelRect: DOMRect): { top: number, left: number } {
  let left = originRect.left + originRect.width / 2 - panelRect.width / 2
  let top = originRect.top - 10 - panelRect.height

  // If overflowing on top, position below
  if (top < 10) top = originRect.bottom + 10

  // Prevent horizontal overflow
  if (left < 10) left = 10
  else if (left + panelRect.width > window.innerWidth - 10) left = window.innerWidth - panelRect.width - 10

  return { top, left }
}

export type FloatingHandle = {
  /** Re-measures the anchor and panel and moves the panel. */
  update (): void
  destroy (): void
}

/**
 * Keeps `panel` (position: fixed) floating above `anchor()`, re-positioning
 * when either resizes or the window does — the imperative counterpart of
 * `useFloatingPanelPosition`. The anchor is a getter so it may not exist yet
 * when the panel is created.
 */
export function floatAbove (panel: HTMLElement, anchor: () => HTMLElement | null): FloatingHandle {
  let observed: HTMLElement | null = null
  const observer = new ResizeObserver(() => update())

  const update = () => {
    const target = anchor()
    if (!target) return
    if (target !== observed) {
      if (observed) observer.unobserve(observed)
      observer.observe(target)
      observed = target
    }
    const { top, left } = computeFloatingPosition(target.getBoundingClientRect(), panel.getBoundingClientRect())
    panel.style.top = `${top}px`
    panel.style.left = `${left}px`
  }

  observer.observe(panel)
  window.addEventListener('resize', update)
  update()

  return {
    update,
    destroy: () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }
}
