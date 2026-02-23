import './style.css'

// Viewer namespaces
export * as Webgl from './webgl'
export * as Ultra from './ultra'

// UI namespaces
export * as ControlBar from './controlbar'
export * as Icons from './icons'

// Config namespaces
export * as Settings from './settings'
export * as Errors from './errors'

// Container
export { type Container, createContainer } from './container'

// Viewer API union
import type { WebglViewerApi } from './webgl/viewerApi'
import type { UltraViewerApi } from './ultra/viewerApi'
export type ViewerApi = WebglViewerApi | UltraViewerApi

// API interfaces
export type { FramingApi } from './state/cameraState'
export type { SectionBoxApi } from './state/sectionBoxState'
export type { IsolationApi, VisibilityStatus } from './state/sharedIsolation'
export type { SettingsApi } from './state/settingsApi'

// Ref types
export type {
  StateRef,
  FuncRef,
} from './helpers/reactUtils'

// BIM data types
export type {
  BimInfoPanelApi,
  DataCustomization,
  DataRender,
  Data,
  Section,
  Group,
  Entry,
} from './bim/bimInfoData'

// Context menu
export * as ContextMenu from './contextMenu'

// Panel customization IDs
export { SectionBoxPanel, IsolationPanel } from './panels'

// Modal
export type { ModalApi, ModalProps } from './panels/modal'
export type { MessageBoxProps } from './panels/messageBox'
export type { LoadingBoxProps, ProgressMode } from './panels/loadingBox'

// Generic panel
export type { GenericPanelApi } from './generic/genericPanel'
export type {
  GenericEntryType,
  GenericTextEntry,
  GenericNumberEntry,
  GenericBoolEntry,
} from './generic/genericField'

// Element types
export type { AugmentedElement } from './helpers/element'
