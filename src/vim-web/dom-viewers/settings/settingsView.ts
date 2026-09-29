import type { GenericCommonEntry } from '../generic'
import type { ViewSpec } from '../viewpanel'
import { settingsPanel, type SettingsPanelHandle } from './settingsPanel'

/** The id the Settings view registers under. */
export const SETTINGS_VIEW = 'settings'

/**
 * The Settings tab of the right-hand panel. VIM Flex keeps settings as a view
 * beside the viewport, including the section box offsets and the render
 * settings that used to live in floating popovers here.
 *
 * `entries` is read each time the tab opens, so a rebuilt settings list is
 * picked up without the view holding a stale copy.
 */
export function settingsView (opts: { entries: () => GenericCommonEntry[] }): ViewSpec {
  let panel: SettingsPanelHandle | undefined
  return {
    title: 'Settings',
    mount: host => {
      panel = settingsPanel(host, { entries: opts.entries() })
    },
    destroy: () => {
      panel?.destroy()
      panel = undefined
    }
  }
}
