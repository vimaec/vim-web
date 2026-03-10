import { AnySettings } from './anySettings'
import { UserBoolean } from './userBoolean'


export type SettingsCustomization<T extends AnySettings> = (items: SettingsItem<T>[]) => SettingsItem<T>[]

export type SettingsItem<T extends AnySettings> = SettingsSubtitle | SettingsToggle<T> | SettingsBox<T> | SettingsSelect<T> | SettingsElement

export type SettingsSubtitle = {
  type: 'subtitle'
  key: string
  title: string
}

export type SettingsToggle<T extends AnySettings> = {
  type: 'toggle'
  key: string
  label: string
  getter: (settings: T) => UserBoolean
  setter: (settings: T, b: boolean) => void
}

export type SettingsBox<T extends AnySettings> = {
  type: 'box'
  key: string
  label: string
  info: string
  transform: (value: number) => number
  getter: (settings: T) => number
  setter: (settings: T, b: number) => void
}

export type SettingsSelect<T extends AnySettings> = {
  type: 'select'
  key: string
  label: string
  options: { label: string, value: string }[]
  getter: (settings: T) => string
  setter: (settings: T, value: string) => void
}

export type SettingsElement = {
  type: 'element'
  key: string
  element: JSX.Element
}
