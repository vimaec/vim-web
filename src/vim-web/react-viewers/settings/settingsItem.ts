import { Settings } from './settings'
import { UserBoolean } from './userBoolean'


export type SettingsCustomizer = (items: SettingsItem[]) => SettingsItem[]

export type SettingsItem = SettingsSubtitle | SettingsToggle | SettingsBox | SettingsElement

export type BaseSettingsItem = {
  type: string
  key: string
}

export type SettingsSubtitle = BaseSettingsItem & {
  type: 'subtitle'
  title: string
}

export type SettingsToggle = BaseSettingsItem & {
  type: 'toggle'
  label: string
  getter: (settings: Settings) => UserBoolean
  setter: (settings: Settings, b: boolean) => void
}

export type SettingsBox = BaseSettingsItem & {
  type: 'box'
  label: string
  info: string
  transform: (value: number) => number
  getter: (settings: Settings) => number
  setter: (settings: Settings, b: number) => void
}

export type SettingsElement = BaseSettingsItem & {
  type: 'element'
  element: JSX.Element
}