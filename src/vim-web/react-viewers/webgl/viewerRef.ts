/**
 * @module public-api
 */

import * as Core from '../../core-viewers'
import { ContextMenuRef } from '../panels/contextMenu'
import { Settings } from '../settings/settings'
import { CameraRef } from '../state/cameraState'
import { Container } from '../container'
import { BimInfoPanelRef } from '../bim/bimInfoData'
import { ControlBarRef } from '../controlbar'
import { ComponentLoader } from './loading'
import { ModalRef } from '../panels/modal'
import { SectionBoxRef } from '../state/sectionBoxState'
import { IsolationRef } from '../state/sharedIsolation'
import { GenericPanelRef } from '../panels'
/**
* Settings API managing settings applied to the viewer.
*/
export type SettingsRef = {
  // Double lambda is required to prevent react from using reducer pattern
  // https://stackoverflow.com/questions/59040989/usestate-with-a-lambda-invokes-the-lambda-when-set

  /**
   * Allows updating settings by providing a callback function.
   * @param updater A function that updates the current settings.
   */
  update : (updater: (settings: Settings) => void) => void

  /**
   * Registers a callback function to be notified when settings are updated.
   * @param callback A function to be called when settings are updated, receiving the updated settings.
   */
  register : (callback: (settings: Settings) => void) => void

}



/**
 * Reference to manage help message functionality in the viewer.
 */
export type HelpRef = {
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
export type ViewerRef = {
  /**
   * HTML structure containing the viewer.
   */
  container: Container

  /**
   * Vim WebGL viewer around which the WebGL viewer is built.
   */
  core: Core.Webgl.Viewer

  /**
   * Vim WebGL loader to download VIMs.
   */
  loader: ComponentLoader

  /**
   * Isolation API managing isolation state in the viewer.
   */
  isolation: IsolationRef

  /**
   * Section box API managing the section box in the viewer.
   */
  sectionBox: SectionBoxRef

  /**
   * Context menu API managing the content and behavior of the context menu.
   */
  contextMenu: ContextMenuRef

  /**
   * Control bar API managing the content and behavior of the control bar.
   */
  controlBar: ControlBarRef

  /**
   * Settings API managing settings applied to the viewer.
   */
  settings: SettingsRef

  /**
   * Message API to interact with the loading box.
   */
  modal: ModalRef

  /**
   * Camera API to interact with the viewer camera at a higher level.
   */
  camera: CameraRef

  /**
   * API To interact with the BIM info panel.
   */
  bimInfo: BimInfoPanelRef

  isolationPanel : GenericPanelRef
  sectionBoxPanel : GenericPanelRef

  /**
   * Cleans up and releases resources used by the viewer.
   */
  dispose: () => void
}
