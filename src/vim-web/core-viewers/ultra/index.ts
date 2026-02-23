import "./style.css"

// Viewer
export type { IUltraViewer as Viewer } from './viewer'
export { INVALID_HANDLE } from './viewer'
export { createCoreUltraViewer as createViewer } from './viewer'

// Data model (interfaces — concrete classes are @internal)
export type { IUltraElement3D } from './element3d'
export type { IUltraVim } from './vim'
export type { IUltraScene } from './scene'

// Viewer component interfaces (returned by Viewer getters)
export type { IUltraCamera, IUltraCameraMovement } from './camera'
export type { IUltraRenderer } from './renderer'
export type { IUltraDecoder } from './decoder'
export type { IUltraViewport } from './viewport'
export type { IUltraSelection } from './selection'
export type { IUltraRaycaster, IUltraRaycastResult } from './raycaster'
export type { ILogger } from '../shared/logger'
export type { IUltraSectionBox } from './sectionBox'

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
export type { IUltraLoadRequest, VimRequestErrorType } from './loadRequest'

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
