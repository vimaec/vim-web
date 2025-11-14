import { AnySettings } from './anySettings'
import { UserBoolean } from './userBoolean'


export type SettingsCustomizer<T extends AnySettings> = (items: SettingsItem<T>[]) => SettingsItem<T>[]

export type SettingsItem<T extends AnySettings> = SettingsSubtitle | SettingsToggle<T> | SettingsBox<T> | SettingsElement

export type BaseSettingsItem = {
  type: string
  key: string
}

export type SettingsSubtitle = BaseSettingsItem & {
  type: 'subtitle'
  title: string
}

export type SettingsToggle<T extends AnySettings> = BaseSettingsItem & {
  type: 'toggle'
  label: string
  getter: (settings: T) => UserBoolean
  setter: (settings: T, b: boolean) => void
}

export type SettingsBox<T extends AnySettings> = BaseSettingsItem & {
  type: 'box'
  label: string
  info: string
  transform: (value: number) => number
  getter: (settings: T) => number
  setter: (settings: T, b: number) => void
}

export type SettingsElement = BaseSettingsItem & {
  type: 'element'
  element: JSX.Element
}