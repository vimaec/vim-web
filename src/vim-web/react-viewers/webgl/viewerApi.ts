/**
 * @module public-api
 */

import * as Core from '../../core-viewers'
import { ContextMenuApi } from '../panels/contextMenu'
import { CameraApi } from '../state/cameraState'
import { Container } from '../container'
import { BimInfoPanelApi } from '../bim/bimInfoData'
import { ControlBarApi } from '../controlbar/controlBar'
import { OpenSettings } from './loading'
import { ModalApi } from '../panels/modal'
import { SectionBoxApi } from '../state/sectionBoxState'
import { IsolationApi } from '../state/sharedIsolation'
import { GenericPanelApi } from '../generic/genericPanel'
import { SettingsApi } from '../state/settingsApi'
import { WebglSettings } from './settings'

export type { OpenSettings } from './loading'

/**
 * Root-level API of the Vim viewer.
 */
export type WebglViewerApi = {
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
  core: Core.Webgl.WebglCoreViewer

  /**
   * Loads a vim file with all geometry for immediate viewing.
   * @param source The url or buffer of the vim file
   * @param settings Optional settings
   * @returns LoadRequest to track progress and get result
   */
  load: (source: Core.Webgl.RequestSource, settings?: OpenSettings) => Core.Webgl.IWebglLoadRequest

  /**
   * Opens a vim file without loading geometry.
   * Use for BIM queries or selective loading via vim.load()/vim.load(subset).
   * @param source The url or buffer of the vim file
   * @param settings Optional settings
   * @returns LoadRequest to track progress and get result
   */
  open: (source: Core.Webgl.RequestSource, settings?: OpenSettings) => Core.Webgl.IWebglLoadRequest

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
  modal: ModalApi

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
  isolationPanel : GenericPanelApi

  /**
   * API to interact with the section box panel.
   */
  sectionBoxPanel : GenericPanelApi

  /**
   * Cleans up and releases resources used by the viewer.
   */
  dispose: () => void
}
