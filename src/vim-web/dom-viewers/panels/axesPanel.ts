import type * as Core from '../../core-viewers'
import type { FramingApi } from '../api'
import { isTrue, type UserBoolean } from '../settings/userBoolean'
import { home, orthographic, perspective } from '../iconSet'
import { iconButton, TIP_ATTR } from '../components'

/** The `ui` settings the axes panel reads. */
export type AxesSettings = {
  panelAxes: UserBoolean
  axesOrthographic: UserBoolean
  axesHome: UserBoolean
}

export type AxesPanelHandle = {
  el: HTMLDivElement
  setVisible (visible: boolean): void
  destroy (): void
}

const ICON_CLASS = 'ds-iconbtn__svg'

/**
 * Orientation gizmo: hosts the core axes canvas (sized to the panel by a
 * ResizeObserver) with home and orthographic/perspective buttons beneath.
 */
export function axesPanel (host: HTMLElement, opts: {
  viewer: Core.Webgl.Viewer
  framing: FramingApi
  settings: AxesSettings
}): AxesPanelHandle {
  const { viewer, framing, settings } = opts
  const disposers: (() => void)[] = []

  const el = document.createElement('div')
  el.className = 'vim-ds-axes'
  el.hidden = !isTrue(settings.panelAxes)

  const gizmo = document.createElement('div')
  gizmo.className = 'vim-ds-axes__gizmo'
  el.appendChild(gizmo)

  const canvas = viewer.gizmos.axes.canvas
  if (canvas) {
    gizmo.appendChild(canvas)
    canvas.classList.add('vim-ds-axes__canvas')
  }
  /**
   * Sizes the canvas to the gizmo box and centers it. The core renders a
   * square canvas, so the box's smaller side sets the size — sizing by width
   * alone would overflow the shorter axis onto the buttons. Idempotent: it
   * writes only when something is off, so re-entry through the style observer
   * below settles immediately.
   */
  const place = () => {
    if (!canvas) return
    const width = gizmo.clientWidth
    const height = gizmo.clientHeight
    const size = Math.min(width, height)
    if (size <= 0) return
    if (canvas.width !== size) viewer.gizmos.axes.resize(size)
    const top = `${Math.round((height - size) / 2)}px`
    const left = `${Math.round((width - size) / 2)}px`
    if (canvas.style.top === top && canvas.style.left === left && canvas.style.right === 'auto') return
    // Replace the core's own top-right corner placement with a centered one.
    canvas.style.top = top
    canvas.style.left = left
    canvas.style.right = 'auto'
  }

  const observer = new ResizeObserver(place)
  observer.observe(gizmo)
  disposers.push(() => observer.disconnect())

  // The core re-places and re-sizes the canvas on its own whenever the viewport
  // resizes; re-center after it rather than racing it.
  if (canvas) {
    const styleWatch = new MutationObserver(place)
    styleWatch.observe(canvas, { attributes: true, attributeFilter: ['style', 'width', 'height'] })
    disposers.push(() => styleWatch.disconnect())
  }

  const showOrtho = isTrue(settings.axesOrthographic)
  const showHome = isTrue(settings.axesHome)
  if (showOrtho || showHome) {
    const buttons = document.createElement('div')
    buttons.className = 'vim-ds-axes__buttons'
    el.appendChild(buttons)

    if (showOrtho) {
      const icon = () => (viewer.camera.orthographic ? orthographic : perspective)({ className: ICON_CLASS })
      const tip = () => viewer.camera.orthographic ? 'Orthographic' : 'Perspective'
      const button = iconButton(buttons, {
        icon: icon(),
        tip: tip(),
        onClick: () => { viewer.camera.orthographic = !viewer.camera.orthographic }
      })
      disposers.push(viewer.camera.onSettingsChanged.subscribe(() => {
        button.el.replaceChildren(icon())
        button.el.setAttribute(TIP_ATTR, tip())
      }))
      disposers.push(() => button.destroy())
    }
    if (showHome) {
      const button = iconButton(buttons, {
        icon: home({ className: ICON_CLASS }),
        tip: 'Reset Camera',
        onClick: () => framing.reset.call()
      })
      disposers.push(() => button.destroy())
    }
  }

  host.appendChild(el)
  return {
    el,
    setVisible: visible => { el.hidden = !visible },
    destroy: () => {
      for (const dispose of disposers) dispose()
      el.remove()
    }
  }
}
