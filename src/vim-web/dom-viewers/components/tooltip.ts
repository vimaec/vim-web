import {
  createTooltip,
  DS_TIP_ATTR,
  type TooltipHandle as DsTooltipHandle,
  type TooltipOptions as DsTooltipOptions
} from '../ds'

/** Attribute a target sets to get a tooltip: `el.setAttribute(TIP_ATTR, 'text')`. */
export const TIP_ATTR = DS_TIP_ATTR

export type TooltipZoneOptions = Pick<DsTooltipOptions, 'delay' | 'anchor'>

export type TooltipZoneHandle = Pick<DsTooltipHandle, 'hide' | 'destroy'>

/**
 * Delegated tooltip for every `[data-ds-tip]` target under `root` — the
 * counterpart of the React `TooltipZone`. One zone per container; targets
 * carry the text, so there is no per-widget wiring. The DS mounts the tip on
 * `document.body` (OSR-safe) and also auto-tips ellipsis-clipped text.
 * Defaults match the control bar: centred above the target, 300 ms.
 */
export function tooltipZone (root: HTMLElement, opts: TooltipZoneOptions = {}): TooltipZoneHandle {
  const ds = createTooltip({ delay: opts.delay ?? 300, anchor: opts.anchor ?? 'element' })
  ds.bindAll(root)
  return {
    hide: () => ds.hide(),
    destroy: () => ds.destroy()
  }
}
