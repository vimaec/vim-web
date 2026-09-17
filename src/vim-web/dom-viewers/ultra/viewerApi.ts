import type * as Core from '../../core-viewers'
import type { FramingApi, IsolationApi, SectionBoxApi, UltraUiApi } from '../api'
import type { Container } from '../container'
import type { GenericPanelApi } from '../generic'
import type { ModalApi } from '../modal'
import type { ControlBarApi } from '../webgl/viewerApi'

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
  framing: FramingApi
  isolation: IsolationApi
  isolationPanel: GenericPanelApi
  sectionBoxPanel: GenericPanelApi
  /** Runtime UI visibility toggles, one StateRef per `ui` settings key. */
  ui: UltraUiApi
  /** Disposes of the viewer and its resources. */
  dispose: () => void
  /** Loads a VIM file via the Ultra server, with progress UI and error reporting. */
  load (source: Core.Ultra.VimSource): Core.Ultra.IUltraLoadRequest
  /** Unloads a vim from the viewer and disposes it. */
  unload (vim: Core.Ultra.IUltraVim): void
}
