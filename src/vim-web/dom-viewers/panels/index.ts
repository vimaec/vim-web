/**
 * The viewer's own chrome — side panel, overlay, logo, axes, speed toast — is built by the viewer
 * roots and is not exported: each piece takes options shaped for that one call site.
 */

// The context menu's shapes, for `viewer.contextMenu.customize()`.
export {
  contextMenuIds,
  type ContextMenuApi,
  type ContextMenuButton,
  type ContextMenuCustomization,
  type ContextMenuDivider,
  type ContextMenuElement,
  type ContextMenuPosition
} from './contextMenu'
