import * as THREE from 'three'
import type * as Core from '../../core-viewers'
import type { ISignal } from '../../core-viewers/shared/events'
import { createFuncRef, createState, type FuncRef, type StateRef } from '../../state'
import type { IsolationSettings } from '../webgl/settings'
import { createWebglAdapters } from '../webgl/isolationAdapters'
import { createUltraIsolationAdapter } from '../ultra/isolationAdapter'
import { createSettingState } from './settingState'

export type VisibilityStatus = 'all' | 'some' | 'none'

/**
 * Controls element visibility and isolation in the viewer. Shared between
 * WebGL and Ultra.
 *
 * @example
 * viewer.isolation.isolateSelection()  // Show only selected elements
 * viewer.isolation.showAll()           // Reset visibility
 * viewer.isolation.showGhost.set(true) // Show hidden elements as ghosts
 */
export interface IsolationApi {
  /** Current visibility status (observable). */
  visibility: StateRef<VisibilityStatus>
  /** Whether auto-isolate is enabled (observable). When true, selecting an element auto-isolates it. */
  autoIsolate: StateRef<boolean>
  /** Whether the isolation settings panel is shown (observable). */
  showPanel: StateRef<boolean>
  /** Whether hidden elements are rendered as ghosts (observable). */
  showGhost: StateRef<boolean>
  /** Ghost material opacity 0-1 (observable). */
  ghostOpacity: StateRef<number>
  /** Hook called when auto-isolate triggers. Use `update()` to add middleware. */
  onAutoIsolate: FuncRef<void, void>
  /** Hook called when visibility changes. Use `update()` to add middleware. */
  onVisibilityChange: FuncRef<void, void>

  /** Returns true if any elements are selected. */
  hasSelection (): boolean
  /** Returns true if any selected elements are currently visible. */
  hasVisibleSelection (): boolean
  /** Returns true if any selected elements are currently hidden. */
  hasHiddenSelection (): boolean
  /** Clears the current selection. */
  clearSelection (): void
  /** Shows only selected elements, hiding everything else. */
  isolateSelection (): void
  /** Hides the currently selected elements. */
  hideSelection (): void
  /** Makes the currently selected elements visible. */
  showSelection (): void
  /** Isolates elements by their instance indices (only these will be visible). */
  isolate (instances: number[]): void
  /** Shows elements by their instance indices. */
  show (instances: number[]): void
  /** Hides elements by their instance indices. */
  hide (instances: number[]): void
  /** Hides all elements. */
  hideAll (): void
  /** Resets visibility — makes all elements visible. */
  showAll (): void
}

export interface IIsolationAdapter {
  onSelectionChanged: ISignal
  onVisibilityChange: ISignal
  computeVisibility: () => VisibilityStatus

  hasSelection (): boolean
  hasVisibleSelection (): boolean
  hasHiddenSelection (): boolean

  clearSelection (): void
  isolateSelection (): void
  hideSelection (): void
  showSelection (): void

  isolate (instances: number[]): void
  show (instances: number[]): void
  hide (instances: number[]): void

  hideAll (): void
  showAll (): void

  showGhost (show: boolean): void
  getShowGhost (): boolean
  getGhostOpacity (): number
  setGhostOpacity (opacity: number): void
}

/**
 * Render settings API — controls outline, transparency, selection fill, and
 * rooms. WebGL only; Ultra renders server-side.
 *
 * @example
 * viewer.renderSettings.outlineEnabled.set(false)
 * viewer.renderSettings.selectionFillMode.set('xray')
 */
export interface RenderSettingsApi {
  /** Whether transparent materials are rendered (observable). */
  showTransparent: StateRef<boolean>
  /** Opacity of transparent materials 0-1 (observable). */
  transparentOpacity: StateRef<number>
  /** Whether selection outlines are enabled (observable). */
  outlineEnabled: StateRef<boolean>
  /** Outline quality: 'low' (0.5x) | 'medium' (1x) | 'high' (2x) render target scale. */
  outlineQuality: StateRef<string>
  /** Outline thickness in screen pixels (1-5). */
  outlineThickness: StateRef<number>
  /** Selection fill mode: 'none' | 'default' | 'xray' | 'seethrough' (observable). */
  selectionFillMode: StateRef<string>
  /** Opacity of the overlay pass in 'xray' and 'seethrough' modes (0-1). */
  selectionOverlayOpacity: StateRef<number>
  /** Whether room elements are shown (observable). */
  showRooms: StateRef<boolean>
}

export interface IRenderSettingsAdapter {
  getShowTransparent (): boolean
  setShowTransparent (enabled: boolean): void
  getTransparentOpacity (): number
  setTransparentOpacity (opacity: number): void
  getOutlineEnabled (): boolean
  setOutlineEnabled (enabled: boolean): void
  getOutlineQuality (): string
  setOutlineQuality (quality: string): void
  getOutlineThickness (): number
  setOutlineThickness (thickness: number): void
  getSelectionFillMode (): string
  setSelectionFillMode (mode: string): void
  getSelectionOverlayOpacity (): number
  setSelectionOverlayOpacity (opacity: number): void
  getShowRooms (): boolean
  setShowRooms (show: boolean): void
}

export type IsolationHandle = IsolationApi & { destroy (): void }
export type RenderSettingsHandle = RenderSettingsApi & { destroy (): void }

/** Visibility and isolation state over a viewer adapter. Shared by WebGL and Ultra. */
export function createSharedIsolation (adapter: IIsolationAdapter): IsolationHandle {
  const visibility = createState<VisibilityStatus>(adapter.computeVisibility())
  const autoIsolate = createState(false)
  const showPanel = createState(false)
  const showGhost = createState(adapter.getShowGhost())
  // Block zero — a fully transparent ghost is invisible, same as hidden.
  const ghostOpacity = createSettingState(() => adapter.getGhostOpacity(), {
    storageKey: 'vim.ghost.opacity',
    validate: (next, current) => {
      const rounded = Math.round(Math.max(0, Math.min(1, next)) * 100) / 100
      return rounded <= 0 ? current : rounded
    }
  })

  const onAutoIsolate = createFuncRef(() => {
    if (adapter.hasSelection()) adapter.isolateSelection()
    else adapter.showAll()
  })
  const onVisibilityChange = createFuncRef(() => {
    visibility.set(adapter.computeVisibility())
  })

  // Push the initial state into the adapter: a persisted opacity must reach the material.
  adapter.showGhost(showGhost.get())
  adapter.setGhostOpacity(ghostOpacity.get())

  const unsubscribes = [
    adapter.onVisibilityChange.subscribe(() => onVisibilityChange.call()),
    adapter.onSelectionChanged.subscribe(() => { if (autoIsolate.get()) onAutoIsolate.call() }),
    autoIsolate.onChange.subscribe(v => { if (v) onAutoIsolate.call() }),
    showGhost.onChange.subscribe(v => adapter.showGhost(v)),
    ghostOpacity.onChange.subscribe(v => adapter.setGhostOpacity(v))
  ]

  return {
    visibility,
    autoIsolate,
    showPanel,
    showGhost,
    ghostOpacity,
    onAutoIsolate,
    onVisibilityChange,
    hasSelection: () => adapter.hasSelection(),
    hasVisibleSelection: () => adapter.hasVisibleSelection(),
    hasHiddenSelection: () => adapter.hasHiddenSelection(),
    clearSelection: () => adapter.clearSelection(),
    isolateSelection: () => adapter.isolateSelection(),
    hideSelection: () => adapter.hideSelection(),
    showSelection: () => adapter.showSelection(),
    isolate: instances => adapter.isolate(instances),
    show: instances => adapter.show(instances),
    hide: instances => adapter.hide(instances),
    hideAll: () => adapter.hideAll(),
    showAll: () => adapter.showAll(),
    destroy: () => { for (const u of unsubscribes) u() }
  }
}

/** Render settings as persisted observables over the WebGL adapter. */
export function createRenderSettings (adapter: IRenderSettingsAdapter): RenderSettingsHandle {
  const showTransparent = createSettingState(() => adapter.getShowTransparent())
  const transparentOpacity = createSettingState(() => adapter.getTransparentOpacity(), { storageKey: 'vim.transparent.opacity' })
  const outlineEnabled = createSettingState(() => adapter.getOutlineEnabled(), { storageKey: 'vim.outline.enabled' })
  const outlineQuality = createSettingState(() => adapter.getOutlineQuality(), { storageKey: 'vim.outline.quality' })
  const outlineThickness = createSettingState(() => adapter.getOutlineThickness(), { storageKey: 'vim.outline.thickness' })
  const selectionFillMode = createSettingState(() => adapter.getSelectionFillMode(), { storageKey: 'vim.selection.fillMode' })
  const selectionOverlayOpacity = createSettingState(() => adapter.getSelectionOverlayOpacity(), { storageKey: 'vim.selection.overlayOpacity' })
  const showRooms = createSettingState(() => adapter.getShowRooms())

  const unsubscribes = [
    showTransparent.onChange.subscribe(v => adapter.setShowTransparent(v)),
    transparentOpacity.onChange.subscribe(v => adapter.setTransparentOpacity(v)),
    outlineEnabled.onChange.subscribe(v => adapter.setOutlineEnabled(v)),
    outlineQuality.onChange.subscribe(v => adapter.setOutlineQuality(v)),
    outlineThickness.onChange.subscribe(v => adapter.setOutlineThickness(v)),
    selectionFillMode.onChange.subscribe(v => adapter.setSelectionFillMode(v)),
    selectionOverlayOpacity.onChange.subscribe(v => adapter.setSelectionOverlayOpacity(v)),
    showRooms.onChange.subscribe(v => adapter.setShowRooms(v))
  ]

  return {
    showTransparent,
    transparentOpacity,
    outlineEnabled,
    outlineQuality,
    outlineThickness,
    selectionFillMode,
    selectionOverlayOpacity,
    showRooms,
    destroy: () => { for (const u of unsubscribes) u() }
  }
}

export function createWebglIsolation (viewer: Core.Webgl.Viewer, settings?: IsolationSettings) {
  // Seed the material with the configured ghost look before the state initializes from it;
  // a persisted localStorage opacity still takes precedence (the state reads it first).
  if (settings?.ghostOpacity !== undefined) viewer.materials.ghostOpacity = settings.ghostOpacity
  if (settings?.ghostColor !== undefined) viewer.materials.ghostColor = new THREE.Color(settings.ghostColor)
  const { isolationAdapter, renderSettingsAdapter } = createWebglAdapters(viewer, settings)
  return {
    isolation: createSharedIsolation(isolationAdapter),
    renderSettings: createRenderSettings(renderSettingsAdapter)
  }
}

export function createUltraIsolation (viewer: Core.Ultra.Viewer, settings?: IsolationSettings) {
  if (settings?.ghostOpacity !== undefined) viewer.renderer.ghostOpacity = settings.ghostOpacity
  if (settings?.ghostColor !== undefined) viewer.renderer.ghostColor = new THREE.Color(settings.ghostColor)
  return createSharedIsolation(createUltraIsolationAdapter(viewer, settings?.showGhost))
}
