import "./style.css"

// Viewer
export { Viewer, INVALID_HANDLE } from './viewer'

// Data model (interfaces — concrete classes are @internal)
export type { IUltraElement3D } from './element3d'
export type { IUltraVim } from './vim'

// Viewer component interfaces (returned by Viewer getters)
export type { ICamera } from './camera'
export type { IRenderer } from './renderer'
export type { IDecoder } from './decoder'
export type { IViewport } from './viewport'
export type { ISelection } from './selection'
export type { IUltraRaycaster, IUltraRaycastResult } from './raycaster'
export type { IReadonlyVimCollection } from '../shared/vimCollection'
export type { ILogger } from '../shared/logger'
export type { IColorManager } from './colorManager'
export type { IRemoteColor } from './remoteColor'
export type { ISectionBox } from './sectionBox'

// RPC types
export { Segment } from './rpcTypes'

// Enums (runtime values)
export { VisibilityState } from './visibility'
export type { IVisibilitySynchronizer } from './visibility'
export { InputMode, VimLoadingStatus } from './rpcSafeClient'

// Settings
export type { RenderSettings } from './renderer'
export { defaultRenderSettings } from './renderer'
export type { SceneSettings } from './rpcSafeClient'
export { defaultSceneSettings } from './rpcSafeClient'

// Loading
export type { VimSource, VimLoadingState } from './rpcSafeClient'
export type { ILoadRequest, VimRequestErrorType } from './loadRequest'

// Connection
export type { ConnectionSettings } from './socketClient'
export type {
  ClientState,
  ClientError,
  ClientStateConnecting,
  ClientStateValidating,
  ClientStateConnected,
  ClientStateDisconnected,
  ClientStateCompatibilityError,
  ClientStateConnectionError,
  ClientStateStreamError,
} from './socketClient'
