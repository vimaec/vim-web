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

export * as Components from './components'
export * as ControlBar from './controlbar'
export * as Generic from './generic'
export * as Icons from './iconSet'
export * as Modal from './modal'
export * as Panels from './panels'
export { childScope, type ChildScope } from './ds'
