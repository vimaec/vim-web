import { createPanel } from '../ds'
import { genericContent, type GenericCommonEntry, type GenericContentHandle } from '../generic'

export type SettingsPanelHandle = {
  el: HTMLElement
  setVisible (visible: boolean): void
  /** Rebuilds the content; pass entries to replace them. */
  update (entries?: GenericCommonEntry[]): void
  destroy (): void
}

/**
 * The settings page shown in the side panel: a filled DS panel over
 * data-driven content. Entries come from the framework-neutral settings
 * builders (`getWebglSettingsContent`, `getUltraSettingsContent`).
 */
export function settingsPanel (host: HTMLElement, opts: {
  entries: GenericCommonEntry[]
  title?: string
  /** Shows a × in the head; the side panel passes `side.popContent`. */
  onClose?: () => void
}): SettingsPanelHandle {
  const panel = createPanel(host, { title: opts.title ?? 'Settings', fill: true, onClose: opts.onClose })
  panel.el.classList.add('vim-ds-settings')

  let entries = opts.entries
  let content: GenericContentHandle = genericContent(panel.body, entries)

  return {
    el: panel.el,
    setVisible: visible => panel.setVisible(visible),
    update: next => {
      if (next) entries = next
      content.destroy()
      content = genericContent(panel.body, entries)
    },
    destroy: () => {
      content.destroy()
      panel.destroy()
    }
  }
}
