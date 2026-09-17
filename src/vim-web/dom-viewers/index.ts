/**
 * React-free UI layer built on the vim-html-ds design system.
 *
 * Built alongside `react-viewers/` during the port (strangler pattern): widgets
 * are ported one by one against the same observable state and ViewerApi, and
 * the viewer is switched over once this layer reaches parity. React and its
 * peer dependencies are removed last. Progress and the widget inventory live
 * in DS_PORT.md.
 *
 * DS components expect a `.ds-root` ancestor (box-sizing, selection, links);
 * the mount container provides it.
 */
import 'vim-html-ds/styles/ds.css'
import './style.css'

// Viewer roots
export * as Webgl from './webgl'
export * as Ultra from './ultra'
import type { WebglViewerApi } from './webgl/viewerApi'
import type { UltraViewerApi } from './ultra/viewerApi'
export type ViewerApi = WebglViewerApi | UltraViewerApi

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
