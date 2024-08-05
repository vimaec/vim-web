/**
 * @module public-api
 */

import * as VIM from 'vim-webgl-viewer/'
import { ComponentLoader } from './panels/loading'
import { ContextMenuCustomization } from './panels/contextMenu'
import { ComponentSettings } from './settings/settings'
import { Isolation } from './helpers/isolation'
import { ComponentCamera } from './helpers/camera'
import { VimComponentContainer } from './container'
import { BimInfoPanelRef } from './bim/bimInfoData'
import { ControlBarCustomization, elementIds } from './controlbar/controlBar'

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

export type ContextMenuRef = {
  /**
  * Defines a callback function to dynamically customize the context menu.
  * @param customization The configuration object specifying the customization options for the context menu.
  */
  customize : (customization: ContextMenuCustomization) => void
 }

export type ControlBarRef = {
  /**
  * Defines a callback function to dynamically customize the control bar.
  * @param customization The configuration object specifying the customization options for the control bar.
  */
  customize : (customization: ControlBarCustomization) => void
 }

/**
* Message API to interact with the loading box.
*/
export type MessageRef = {
  /**
   * Displays the provided content as a modal loading message.
   * @param content The content to be displayed.
   * @param info Optional additional information.
   */
  show(content : string, info?: string)

  /**
   * Hides the current loading message.
   */
  hide()
 }

/**
 * Root-level API of the Vim component.
 */
export type VimComponentRef = {
  /**
   * HTML structure containing the component.
   */
  container: VimComponentContainer

  /**
  * Vim WebGL viewer around which the WebGL component is built.
  */
  viewer: VIM.Viewer

  /**
  * Vim WebGL loader to download VIMs.
  */
  loader: ComponentLoader

  /**
  * Isolation API managing isolation state in the component.
  */
  isolation: Isolation

  /**
  * Context menu API managing the content and behavior of the context menu.
  */
  contextMenu : ContextMenuRef

    /**
  * Context menu API managing the content and behavior of the context menu.
  */
    controlBar : ControlBarRef

  /**
  * Settings API managing settings applied to the component.
  */
  settings: SettingsRef

  /**
  * Message API to interact with the loading box.
  */
  message : MessageRef

  /**
  * Camera API to interact with the viewer camera at a higher level.
  */
  camera: ComponentCamera

  /**
   * API To interact with the BIM info panel.
   */
  bimInfo: BimInfoPanelRef

  dispose: () => void
}
