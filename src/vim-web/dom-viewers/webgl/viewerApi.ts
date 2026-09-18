import type * as Core from '../../core-viewers'
import type { FramingApi, IsolationApi, RenderSettingsApi, SectionBoxApi, WebglUiApi } from '../api'
import type { Container } from '../container'
import type { BimInfoPanelApi } from '../bim'
import type { ControlBarCustomization } from '../controlbar'
import type { GenericPanelApi } from '../generic'
import type { ModalApi } from '../modal'
import type { ContextMenuApi } from '../panels'
import type { TopBarApi } from '../topbar'
import type { OpenSettings } from './loader'

export type { OpenSettings }

/** Public customization hook of the control bar. */
export type ControlBarApi = {
  customize (fn: ControlBarCustomization): void
}

/**
 * Root-level API of the WebGL viewer — the same surface as the React
 * `WebglViewerApi`, with DOM-based customization hooks (control bar icons,
 * context menu actions and BIM info render overrides take / return `Element`).
 */
export type WebglViewerApi = {
  /** Discriminant to distinguish WebGL from Ultra viewer. */
  type: 'webgl'
  /** HTML structure containing the viewer. */
  container: Container
  /** The underlying WebGL core viewer. */
  core: Core.Webgl.Viewer
  /** Loads a vim with all geometry, with progress UI, auto-framing and error reporting. */
  load: (source: Core.Webgl.RequestSource, settings?: OpenSettings) => Core.Webgl.IWebglLoadRequest
  /** Opens a vim without loading geometry. */
  open: (source: Core.Webgl.RequestSource, settings?: OpenSettings) => Core.Webgl.IWebglLoadRequest
  /** Unloads a vim from the viewer and disposes it. */
  unload: (vim: Core.Webgl.IWebglVim) => void
  isolation: IsolationApi
  renderSettings: RenderSettingsApi
  sectionBox: SectionBoxApi
  contextMenu: ContextMenuApi
  controlBar: ControlBarApi
  /** The application bar above the side panel and the viewport. */
  topBar: TopBarApi
  modal: ModalApi
  framing: FramingApi
  bimInfo: BimInfoPanelApi
  isolationPanel: GenericPanelApi
  sectionBoxPanel: GenericPanelApi
  /** Runtime UI visibility toggles, one StateRef per `ui` settings key. */
  ui: WebglUiApi
  /** Cleans up and releases resources used by the viewer. */
  dispose: () => void
}
