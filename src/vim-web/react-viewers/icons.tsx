/**
 * @module icons
 */

/**
 * Defines all icons for the VIM viewer as React elements. The SVG data lives in
 * src/vim-web/icons (shared with the DOM layer); this file only binds the public
 * `Icons.*` names to the React renderer.
 * @packageDocumentation
 */

import type { ReactElement } from 'react'
import { renderIcon } from './iconRender'
import { iconNames, type IconName, type IconOptions } from '../icons'

export type { IconOptions }

type IconComponent = (options?: IconOptions) => ReactElement

const icons = Object.fromEntries(
  iconNames.map(name => [name, (options?: IconOptions) => renderIcon(name, options)])
) as Record<IconName, IconComponent>

/**
 * Listed explicitly so TypeScript flags any drift between this list and the icon data.
 */
export const {
  pointer, filter, slidersHoriz, settings, help, trash, checkmark, undo, closeIcon, home,
  fullScreen, minimize, treeView, more, collapse, arrowLeft, fullArrowLeft, visible, hidden,
  frameScene, autoCamera, orbit, look, perspective, orthographic, camera, pan, zoom, frameRect,
  frameSelection, showAll, showSelection, hideSelection, isolateSelection, autoIsolate,
  toggleIsolation, measure, sectionBoxSettings, sectionBoxAuto, sectionBoxVisible, sectionBox,
  sectionBoxDisable, sectionBoxClip, sectionBoxIgnore, sectionBoxReset, sectionBoxShrink,
  sectionBoxShrink2, ghost, ghostDead
} = icons
