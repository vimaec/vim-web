import { AnySettings } from '../settings/anySettings'
import { SettingsItem } from '../settings/settingsItem'

/**
* Settings API managing settings applied to the viewer.
*/
export type SettingsApi<T extends AnySettings> = {
  // Double lambda is required to prevent react from using reducer pattern
  // https://stackoverflow.com/questions/59040989/usestate-with-a-lambda-invokes-the-lambda-when-set

  /**
   * Allows updating settings by providing a callback function.
   * @param updater A function that updates the current settings.
   */
  update : (updater: (settings: T) => void) => void

  /**
   * Registers a callback function to be notified when settings are updated.
   * @param callback A function to be called when settings are updated, receiving the updated settings.
   */
  register : (callback: (settings: T) => void) => void

  /**
   * Customizes the settings panel by providing a customizer function.
   * @param customizer A function that modifies the settings items.
   */
  customize : (customizer: (items: SettingsItem<T>[]) => SettingsItem<T>[]) => void

}
