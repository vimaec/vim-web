import type { GenericCommonEntry } from '../generic/genericField'

/** A settings entry — the subset of generic entries both UI layers render. */
export type SettingsItem = GenericCommonEntry
export type SettingsCustomization = (items: SettingsItem[]) => SettingsItem[]
