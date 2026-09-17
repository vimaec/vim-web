import { createMenu, type MenuEntry } from '../ds'
import type * as Core from '../../core-viewers'
import type { FramingApi, IsolationApi } from '../api'
import type { ModalApi } from '../modal'
import { contextMenuIds as Ids } from './contextMenuIds'

export { contextMenuIds } from './contextMenuIds'

export type ContextMenuButton = {
  type: 'button'
  id: string
  label: string
  /** Shortcut shown after the label. */
  keyboard?: string
  action: () => void
  /** Disabled entries are not shown, as in the React menu. */
  enabled: boolean
}

export type ContextMenuDivider = {
  type: 'divider'
  id: string
  enabled: boolean
}

export type ContextMenuElement = ContextMenuButton | ContextMenuDivider

/** Maps the base entries to the entries actually shown. */
export type ContextMenuCustomization = (elements: ContextMenuElement[]) => ContextMenuElement[]

/** Public customization hook — the public `ContextMenuApi` contract. */
export type ContextMenuApi = {
  customize (fn: ContextMenuCustomization): void
}

export type ContextMenuPosition = { x: number, y: number }

export type ContextMenuHandle = ContextMenuApi & {
  /** Opens at a screen position (e.g. from the BIM tree), or closes when undefined. */
  show (position: ContextMenuPosition | undefined): void
  destroy (): void
}

/**
 * The viewer's right-click menu on the DS menu (body-level, closes on
 * backdrop, Esc and item click). Entries are built from the current
 * selection/visibility each time it opens; it listens to the core's
 * `inputs.onContextMenu` itself.
 */
export function contextMenu (opts: {
  viewer: Core.Webgl.Viewer
  framing: FramingApi
  modal: ModalApi
  isolation: IsolationApi
}): ContextMenuHandle {
  const { viewer, framing, modal, isolation } = opts
  const menu = createMenu()
  let customization: ContextMenuCustomization | undefined

  const base = (): ContextMenuElement[] => {
    const hasSelection = isolation.hasSelection()
    const visibility = isolation.visibility.get()
    return [
      { type: 'button', id: Ids.showControls, label: 'Show Controls', action: () => modal.help(true), enabled: true },
      { type: 'divider', id: Ids.dividerCamera, enabled: true },
      { type: 'button', id: Ids.resetCamera, label: 'Reset Camera', keyboard: 'HOME', action: () => framing.reset.call(), enabled: true },
      { type: 'button', id: Ids.zoomToFit, label: 'Frame Camera', keyboard: 'F', action: () => framing.frameSelection.call(), enabled: hasSelection },
      { type: 'divider', id: Ids.dividerSelection, enabled: hasSelection || visibility !== 'all' },
      { type: 'button', id: Ids.isolateSelection, label: 'Isolate Object', keyboard: 'I', action: () => isolation.isolateSelection(), enabled: hasSelection && visibility === 'some' },
      { type: 'button', id: Ids.hideObject, label: 'Hide Object', keyboard: 'V', action: () => isolation.hideSelection(), enabled: hasSelection && !isolation.hasHiddenSelection() },
      { type: 'button', id: Ids.showObject, label: 'Show Object', keyboard: 'V', action: () => isolation.showSelection(), enabled: hasSelection && isolation.hasHiddenSelection() },
      { type: 'button', id: Ids.showAll, label: 'Show All', keyboard: 'Esc', action: () => isolation.showAll(), enabled: visibility !== 'all' }
    ]
  }

  const toEntries = (elements: ContextMenuElement[]): MenuEntry[] =>
    elements
      .filter(e => e.enabled)
      .map(e => e.type === 'divider'
        ? 'separator'
        : { label: e.label, hint: e.keyboard, onClick: () => e.action() })

  const show = (position: ContextMenuPosition | undefined) => {
    if (!position) {
      menu.close()
      return
    }
    const elements = customization ? customization(base()) : base()
    menu.setItems(toEntries(elements))
    menu.openAt(position.x - 10, position.y - 10)
  }

  const unsubscribe = viewer.inputs.onContextMenu.subscribe(show)

  return {
    show,
    customize: fn => { customization = fn },
    destroy: () => {
      unsubscribe()
      menu.destroy()
    }
  }
}
