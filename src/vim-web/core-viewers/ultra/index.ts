import "./style.css"

// Viewer
export { Viewer, INVALID_HANDLE } from './viewer'

// Data model
export { Element3D } from './element3d'
export { Vim } from './vim'

// Viewer component interfaces (returned by Viewer getters)
export type { ICamera } from './camera'
export type { IRenderer } from './renderer'
export type { IDecoder } from './decoder'
export type { IViewport } from './viewport'
export type { ISelection } from './selection'
export type { IUltraRaycaster, IUltraRaycastResult } from './raycaster'
export type { IReadonlyVimCollection } from './vimCollection'
export type { ILogger } from './logger'

// Viewer component classes (exposed directly on Viewer)
export type { ColorManager } from './colorManager'
export type { RemoteColor } from './remoteColor'
export type { SectionBox } from './sectionBox'
export type { RpcSafeClient } from './rpcSafeClient'

// RPC types
export { Segment } from './rpcTypes'

// Enums (runtime values)
export { VisibilityState } from './visibility'
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
