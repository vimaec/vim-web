/**
 * @module public-api
 */

import * as Core from '../../core-viewers'
import { ContextMenuApi } from '../panels/contextMenu'
import { AnySettings } from '../settings/anySettings'
import { CameraApi } from '../state/cameraState'
import { Container } from '../container'
import { BimInfoPanelApi } from '../bim/bimInfoData'
import { ControlBarApi } from '../controlbar/controlBar'
import { OpenSettings } from './loading'
import { ModalHandle } from '../panels/modal'
import { SectionBoxApi } from '../state/sectionBoxState'
import { IsolationApi } from '../state/sharedIsolation'
import { GenericPanelHandle } from '../generic/genericPanel'
import { SettingsItem } from '../settings/settingsItem'
import { WebglSettings } from './settings'

export type { OpenSettings } from './loading'
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



/**
 * Reference to manage help message functionality in the viewer.
 */
export type HelpApi = {
  /**
   * Displays the help message.
   * @param value Boolean value to show or hide the help message.
   * @returns void
   */
  show(value: boolean): void

  /**
   * Returns the current state of the help message.
   * @returns boolean indicating if help message is currently shown
   */
  isShow(): boolean
}

/**
 * Root-level API of the Vim viewer.
 */
export type ViewerApi = {
  /**
   * Discriminant to distinguish WebGL from Ultra viewer.
   */
  type: 'webgl'

  /**
   * HTML structure containing the viewer.
   */
  container: Container

  /**
   * Vim WebGL viewer around which the WebGL viewer is built.
   */
  core: Core.Webgl.Viewer

  /**
   * Loads a vim file with all geometry for immediate viewing.
   * @param source The url or buffer of the vim file
   * @param settings Optional settings
   * @returns LoadRequest to track progress and get result
   */
  load: (source: Core.Webgl.RequestSource, settings?: OpenSettings) => Core.Webgl.ILoadRequest

  /**
   * Opens a vim file without loading geometry.
   * Use for BIM queries or selective loading via vim.load()/vim.load(subset).
   * @param source The url or buffer of the vim file
   * @param settings Optional settings
   * @returns LoadRequest to track progress and get result
   */
  open: (source: Core.Webgl.RequestSource, settings?: OpenSettings) => Core.Webgl.ILoadRequest

  /**
   * Unloads a vim from the viewer and disposes it.
   * @param vim The vim to unload
   */
  unload: (vim: Core.Webgl.IWebglVim) => void

  /**
   * Isolation API managing isolation state in the viewer.
   */
  isolation: IsolationApi

  /**
   * Section box API managing the section box in the viewer.
   */
  sectionBox: SectionBoxApi

  /**
   * Context menu API managing the content and behavior of the context menu.
   */
  contextMenu: ContextMenuApi

  /**
   * Control bar API managing the content and behavior of the control bar.
   */
  controlBar: ControlBarApi

  /**
   * Settings API managing settings applied to the viewer.
   */
  settings: SettingsApi<WebglSettings>

  /**
   * Message API to interact with the loading box.
   */
  modal: ModalHandle

  /**
   * Camera API to interact with the viewer camera at a higher level.
   */
  camera: CameraApi

  /**
   * API To interact with the BIM info panel.
   */
  bimInfo: BimInfoPanelApi

  /**
   * API to interact with the isolation panel.
   */
  isolationPanel : GenericPanelHandle

  /**
   * API to interact with the isolation panel.
   */
  sectionBoxPanel : GenericPanelHandle

  /**
   * Cleans up and releases resources used by the viewer.
   */
  dispose: () => void
}
