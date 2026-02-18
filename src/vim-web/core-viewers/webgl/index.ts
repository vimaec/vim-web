// Links files to generate package type exports
import './style.css'

// Useful definitions from vim-format
import { BFastSource } from 'vim-format'
export type VimSource = BFastSource

// Loader
export { MaterialSet } from './loader'
export type { VimSettings, VimPartialSettings } from './loader'
export type { RequestSource, ILoadRequest } from './loader'
export type { Transparency } from './loader'
export type { IElement3D } from './loader'
export type { IElementMapping } from './loader'
export type { IScene } from './loader'
export type { IMaterials } from './loader'
export type { IWebglVim } from './loader'
export type { ISubset, SubsetFilter } from './loader'

// Viewer
export { Viewer, Layers } from './viewer'
export type { ViewerSettings, PartialViewerSettings, MaterialSettings } from './viewer'
export type { ICamera, CameraMovement } from './viewer'
export type { Renderer, RenderingSection } from './viewer'
export type { ISelectable, ISelection } from './viewer'
export type { Viewport } from './viewer'
export type { IRaycaster, IRaycastResult } from './viewer'
export type { Gizmos, GizmoLoading, GizmoOrbit } from './viewer'
export type { GizmoAxes, AxesSettings } from './viewer'
export type { Marker, GizmoMarkers } from './viewer'
export type { IMeasure, MeasureStage } from './viewer'
export type { SectionBox } from './viewer'
