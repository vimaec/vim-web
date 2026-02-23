/**
 * @module public-api
 */

import * as Core from '../../core-viewers'
import { ContextMenuApi } from '../panels/contextMenu'
import { FramingApi } from '../state/cameraState'
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
   * The underlying WebGL core viewer. Provides direct access to low-level 3D operations.
   *
   * Common uses:
   * - `viewer.core.camera.lerp(1).frame(element)` — animated camera movement
   * - `viewer.core.camera.snap().set(pos, target)` — instant camera placement
   * - `viewer.core.selection.select(element)` — programmatic selection
   * - `viewer.core.inputs.pointerMode` — change interaction mode
   * - `viewer.core.gizmos.sectionBox` — direct section box manipulation
   * - `viewer.core.renderer.requestRender()` — force re-render
   */
  core: Core.Webgl.Viewer

  /**
   * Loads a vim file with all geometry for immediate viewing.
   * Wraps core.load() with progress UI (loading modal), auto-framing on completion,
   * and error reporting. For headless loading without UI, use core.load() directly.
   * @param source The url or buffer of the vim file
   * @param settings Optional settings for transforms and auto-framing
   * @returns LoadRequest to track progress and get result
   */
  load: (source: Core.Webgl.RequestSource, settings?: OpenSettings) => Core.Webgl.IWebglLoadRequest

  /**
   * Opens a vim file without loading geometry.
   * Wraps core.load() without building geometry. Use for BIM-only queries or
   * selective loading via vim.load(subset). For headless opening, use core.load() directly.
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
   * High-level framing API with semantic operations (frame selection, auto-camera).
   * For low-level camera control (orbit, pan, zoom, snap/lerp), use {@link core}.camera instead.
   * @see {@link FramingApi}
   */
  framing: FramingApi

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
