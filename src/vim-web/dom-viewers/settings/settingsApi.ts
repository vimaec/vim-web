import type { GenericCommonEntry } from '../generic'

/** Maps the entries the viewer builds to the entries the Settings view shows. */
export type SettingsCustomization = (entries: GenericCommonEntry[]) => GenericCommonEntry[]

/**
 * Customization hook of the Settings view, the same shape as `ControlBarApi` and `TopBarApi`.
 *
 * It replaces the React `isolationPanel` and `sectionBoxPanel` customization: those two floating
 * popovers are sections of one Settings view now, so one hook covers both. Entries are addressed
 * by id — see `settingsIds`.
 *
 * The customization runs each time the view is built, so it sees the current entries rather than
 * a copy taken when it was registered.
 */
export type SettingsViewApi = {
  customize (fn: SettingsCustomization): void
}
