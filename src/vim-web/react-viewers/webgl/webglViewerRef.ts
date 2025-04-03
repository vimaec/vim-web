/**
 * @module public-api
 */

import * as VIM from '../../core-viewers/webgl/index'
import { ContextMenuCustomization } from '../panels/contextMenu'
import { ComponentSettings } from '../settings/settings'
import { CameraRef } from '../state/cameraState'
import { Container } from '../container'
import { BimInfoPanelRef } from '../bim/bimInfoData'
import { ControlBarCustomization } from '../controlbar/controlBar'
import { ComponentLoader } from './webglLoading'
import { ModalRef } from '../panels/modal'
import { SectionBoxRef } from '../state/sectionBoxState'
import { IsolationRef } from '../state/sharedIsolation'
/**
* Settings API managing settings applied to the component.
*/
export type SettingsRef = {
  // Double lambda is required to prevent react from using reducer pattern
  // https://stackoverflow.com/questions/59040989/usestate-with-a-lambda-invokes-the-lambda-when-set

  /**
   * Allows updating settings by providing a callback function.
   * @param updater A function that updates the current settings.
   */
  update : (updater: (settings: ComponentSettings) => void) => void

  /**
   * Registers a callback function to be notified when settings are updated.
   * @param callback A function to be called when settings are updated, receiving the updated settings.
   */
  register : (callback: (settings: ComponentSettings) => void) => void

}

/**
 * Reference to manage context menu functionality in the component.
 */
export type ContextMenuRef = {
  /**
   * Defines a callback function to dynamically customize the context menu.
   * @param customization The configuration object specifying the customization options for the context menu.
   */
  customize: (customization: ContextMenuCustomization) => void
}

/**
 * Reference to manage control bar functionality in the component.
 */
export type ControlBarRef = {
  /**
   * Defines a callback function to dynamically customize the control bar.
   * @param customization The configuration object specifying the customization options for the control bar.
   */
  customize: (customization: ControlBarCustomization) => void
}

/**
 * Reference to manage help message functionality in the component.
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
 * Root-level API of the Vim component.
 */
export type ViewerRef = {
  /**
   * HTML structure containing the component.
   */
  container: Container

  /**
   * Vim WebGL viewer around which the WebGL component is built.
   */
  viewer: VIM.WebglCoreViewer

  /**
   * Vim WebGL loader to download VIMs.
   */
  loader: ComponentLoader

  /**
   * Isolation API managing isolation state in the component.
   */
  isolation: IsolationRef

  /**
   * Section box API managing the section box in the component.
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
   * Settings API managing settings applied to the component.
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

  /**
   * Cleans up and releases resources used by the component.
   */
  dispose: () => void
}
