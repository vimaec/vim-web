import { iconData, type IconName } from './iconData'
import type { IconDef, IconNode, IconOptions } from './types'

const NS = 'http://www.w3.org/2000/svg'
const FILL = '$fill'

/**
 * Builds an icon as a real SVG element from the shared icon data — the DOM
 * counterpart of the React `Icons.*` functions, with the same options.
 */
export function createIcon (
  name: IconName,
  { height = 20, width = 20, fill = 'currentColor', className }: IconOptions = {}
): SVGSVGElement {
  const def: IconDef = iconData[name]
  const svg = document.createElementNS(NS, 'svg')
  svg.setAttribute('viewBox', def.viewBox)
  svg.setAttribute('width', String(width))
  svg.setAttribute('height', String(height))
  if (def.fill) svg.setAttribute('fill', fill)
  if (className) svg.setAttribute('class', className)
  for (const child of def.children) svg.appendChild(build(child, fill))
  return svg
}

function build (node: IconNode, fill: string): SVGElement {
  const el = document.createElementNS(NS, node.tag)
  for (const [key, value] of Object.entries(node.attrs)) {
    el.setAttribute(key, value === FILL ? fill : value)
  }
  for (const child of node.children ?? []) el.appendChild(build(child, fill))
  return el
}
