import { createIcon, iconNames, type IconName, type IconOptions } from '../icons'

export type { IconOptions }

export type IconFactory = (options?: IconOptions) => SVGSVGElement

const factories = Object.fromEntries(
  iconNames.map(name => [name, (options?: IconOptions) => createIcon(name, options)])
) as Record<IconName, IconFactory>

/**
 * The icon set as DOM factories, one per icon name:
 * `Dom.Icons.home()` returns an `SVGSVGElement`;
 * the names are listed explicitly so TypeScript flags
 * any drift between this list and the generated icon data.
 */
export const {
  pointer, filter, slidersHoriz, settings, help, trash, checkmark, undo, closeIcon, home,
  fullScreen, minimize, treeView, more, collapse, arrowLeft, fullArrowLeft, visible, hidden,
  frameScene, autoCamera, orbit, look, perspective, orthographic, camera, pan, zoom, frameRect,
  frameSelection, showAll, showSelection, hideSelection, isolateSelection, autoIsolate,
  toggleIsolation, measure, sectionBoxSettings, sectionBoxAuto, sectionBoxVisible, sectionBox,
  sectionBoxDisable, sectionBoxClip, sectionBoxIgnore, sectionBoxReset, sectionBoxShrink,
  sectionBoxShrink2, ghost, ghostDead
} = factories
