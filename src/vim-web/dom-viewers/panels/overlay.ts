export type OverlayHandle = {
  el: HTMLDivElement
  destroy (): void
}

/**
 * ⚡ Perf-critical, not visual. Sits over the viewer canvas and relays every
 * pointer/mouse/touch/wheel event to it, so a hit lands on one element instead
 * of the browser hit-testing the whole UI tree — with a 10k+ node BIM tree
 * open this is a large frame-rate win. Ported as-is from the React Overlay,
 * plus the listener cleanup it never had.
 */
export function overlay (host: HTMLElement, canvas: HTMLCanvasElement): OverlayHandle {
  const el = document.createElement('div')
  el.className = 'vim-ds-overlay'
  el.addEventListener('contextmenu', e => e.preventDefault())

  const disposers: (() => void)[] = []
  const relay = (
    type: string,
    construct: (type: string, e: Event) => Event,
    preventDefault = true,
    options?: AddEventListenerOptions
  ) => {
    const listener = (e: Event) => {
      canvas.dispatchEvent(construct(type, e))
      if (preventDefault) e.preventDefault()
    }
    el.addEventListener(type, listener, options)
    disposers.push(() => el.removeEventListener(type, listener, options))
  }

  relay('mousedown', (t, e) => new MouseEvent(t, e as MouseEvent))
  relay('mousemove', (t, e) => new MouseEvent(t, e as MouseEvent))
  relay('mouseup', (t, e) => new MouseEvent(t, e as MouseEvent))
  relay('dblclick', (t, e) => new MouseEvent(t, e as MouseEvent))
  relay('mouseout', (t, e) => new MouseEvent(t, e as MouseEvent))
  relay('wheel', (t, e) => new WheelEvent(t, e as WheelEvent))

  relay('pointerdown', (t, e) => new PointerEvent(t, e as PointerEvent), false)
  relay('pointermove', (t, e) => new PointerEvent(t, e as PointerEvent), false)
  relay('pointerup', (t, e) => new PointerEvent(t, e as PointerEvent), false)
  relay('pointerenter', (t, e) => new PointerEvent(t, e as PointerEvent))
  relay('pointerleave', (t, e) => new PointerEvent(t, e as PointerEvent))

  const active = { passive: false }
  relay('touchstart', (t, e) => new TouchEvent(t, e), false, active)
  relay('touchend', (t, e) => new TouchEvent(t, e), false)
  relay('touchmove', (t, e) => new TouchEvent(t, e), false, active)

  host.appendChild(el)
  return {
    el,
    destroy: () => {
      for (const dispose of disposers) dispose()
      el.remove()
    }
  }
}
