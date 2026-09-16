import { createElement, type ReactElement } from 'react'
import { iconData, type IconDef, type IconName, type IconNode, type IconOptions } from '../icons'

const FILL = '$fill'

/**
 * Renders an icon from the shared icon data as JSX — the React counterpart of
 * `createIcon` in src/vim-web/icons/svg.ts. The `Icons.*` functions in
 * icons.tsx are thin wrappers over this, so both layers draw the same data.
 */
export function renderIcon (
  name: IconName,
  { height = 20, width = 20, fill = 'currentColor', className }: IconOptions = {}
): ReactElement {
  const def: IconDef = iconData[name]
  return createElement(
    'svg',
    { viewBox: def.viewBox, width, height, className, fill: def.fill ? fill : undefined },
    ...def.children.map(node => build(node, fill))
  )
}

function build (node: IconNode, fill: string): ReactElement {
  const props: Record<string, string> = {}
  for (const [key, value] of Object.entries(node.attrs)) props[key] = value === FILL ? fill : value
  return createElement(node.tag, props, ...(node.children ?? []).map(child => build(child, fill)))
}
