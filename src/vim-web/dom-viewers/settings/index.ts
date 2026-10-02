// The settings view is registered by the viewer roots; the id opens it through `viewer.views`,
// and `viewer.settingsView` customizes what it shows.
export { SETTINGS_VIEW } from './settingsView'
export { settingsIds, type SettingsId } from './settingsIds'
export type { SettingsViewApi, SettingsCustomization } from './settingsApi'
export { type UserBoolean, isTrue, isFalse } from './userBoolean'
export type { AnySettings } from './anySettings'
