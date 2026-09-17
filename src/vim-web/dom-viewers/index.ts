/**
 * The vim-web UI layer, built on the vim-html-ds design system: imperative
 * DOM widgets (`createX(host, opts) => handle`) over the framework-neutral
 * observables in `src/vim-web/state`.
 *
 * DS components expect a `.ds-root` ancestor (box-sizing, selection, links);
 * the viewer roots add it to the container's UI mount. Widget-by-widget notes
 * from the React port live in DS_PORT.md.
 */
import 'vim-html-ds/styles/ds.css'
import './style.css'

// Viewer roots
export * as Webgl from './webgl'
export * as Ultra from './ultra'
import type { WebglViewerApi } from './webgl/viewerApi'
import type { UltraViewerApi } from './ultra/viewerApi'
export type ViewerApi = WebglViewerApi | UltraViewerApi

// Container
export { type Container, createContainer } from './container'

// API interfaces
export type {
  FramingApi,
  SectionBoxApi,
  IsolationApi,
  VisibilityStatus,
  RenderSettingsApi,
  WebglUiApi,
  UltraUiApi
} from './api'

// Observables
export { type StateRef, type FuncRef, createState, createFuncRef } from '../state'

// Element types
export type { AugmentedElement } from './helpers/element'

// UI namespaces
export * as Bim from './bim'
export * as Components from './components'
export * as ControlBar from './controlbar'
export * as Errors from './errors'
export * as Generic from './generic'
export * as Icons from './iconSet'
export * as Modal from './modal'
export * as Panels from './panels'
export * as Settings from './settings'
export * as State from './state'
export { childScope, type ChildScope } from './ds'
