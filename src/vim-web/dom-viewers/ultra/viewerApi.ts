import type * as Core from '../../core-viewers'
import type { FramingApi, IsolationApi, SectionBoxApi, UltraUiApi } from '../api'
import type { Container } from '../container'
import type { ModalApi } from '../modal'
import type { ControlBarApi } from '../webgl/viewerApi'
import type { TopBarApi } from '../topbar'
import type { ViewPanelApi } from '../viewpanel'
import type { SettingsViewApi } from '../settings'

/**
 * Root-level API of the Ultra viewer — the same surface as the React
 * `UltraViewerApi`, with DOM-based customization hooks.
 */
export type UltraViewerApi = {
  /** Discriminant to distinguish Ultra from WebGL viewer. */
  type: 'ultra'
  /** HTML structure containing the viewer. */
  container: Container
  /** The underlying Ultra core viewer. */
  core: Core.Ultra.Viewer
  modal: ModalApi
  sectionBox: SectionBoxApi
  controlBar: ControlBarApi
  /** The application bar above the side panel and the viewport. */
  topBar: TopBarApi
  /** The tabbed dock on the right; views are registered here and opened by id. */
  views: ViewPanelApi
  /** What the Settings view shows — the hook the isolation popover used to carry. */
  settingsView: SettingsViewApi
  framing: FramingApi
  isolation: IsolationApi
  /** Runtime UI visibility toggles, one StateRef per `ui` settings key. */
  ui: UltraUiApi
  /** Disposes of the viewer and its resources. */
  dispose: () => void
  /** Loads a VIM file via the Ultra server, with progress UI and error reporting. */
  load (source: Core.Ultra.VimSource): Core.Ultra.IUltraLoadRequest
  /** Unloads a vim from the viewer and disposes it. */
  unload (vim: Core.Ultra.IUltraVim): void
}
