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

// API interfaces
export type { CameraApi } from './state/cameraState'
export type { SectionBoxApi } from './state/sectionBoxState'
export type { IsolationApi, VisibilityStatus } from './state/sharedIsolation'

// Ref types
export type {
  StateRef,
  ActionRef,
  ArgActionRef,
  FuncRef,
  AsyncFuncRef,
  ArgFuncRef,
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
export type {
  ContextMenuApi,
  ContextMenuCustomization,
  ContextMenuElement,
  IContextMenuButton,
  IContextMenuDivider,
} from './panels/contextMenu'
export { contextMenuElementIds } from './panels/contextMenu'

// Panel customization IDs
export { SectionBoxPanel, IsolationPanel } from './panels'

// Modal
export type { ModalHandle, ModalProps } from './panels/modal'
export type { MessageBoxProps } from './panels/messageBox'
export type { LoadingBoxProps, ProgressMode } from './panels/loadingBox'

// Generic panel
export type { GenericPanelHandle } from './generic/genericPanel'
export type {
  GenericEntryType,
  GenericTextEntry,
  GenericNumberEntry,
  GenericBoolEntry,
} from './generic/genericField'

// Element types
export type { AugmentedElement } from './helpers/element'
