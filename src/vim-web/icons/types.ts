/**
 * Common icon options, shared by the React and DOM renderers.
 */
export type IconOptions = {
  height?: number | string
  width?: number | string
  fill?: string
  className?: string
}

export type IconTag = 'path' | 'g' | 'rect' | 'circle' | 'ellipse'

/** One SVG element of an icon. Attribute value `'$fill'` is replaced by the caller's fill. */
export type IconNode = {
  tag: IconTag
  attrs: Record<string, string>
  children?: IconNode[]
}

/** A complete icon: its viewBox and element tree. `fill` is set when the fill lives on the root. */
export type IconDef = {
  viewBox: string
  fill?: '$fill'
  children: IconNode[]
}
