import { AnySettings } from './anySettings'
import { RecursivePartial } from '../../utils'
import deepmerge from 'deepmerge'

export function createSettings<T extends AnySettings>(settings: RecursivePartial<T>, defaultSettings: T): T {
  return settings !== undefined
    ? deepmerge(defaultSettings, settings as Partial<T>) as T
    : defaultSettings
}
