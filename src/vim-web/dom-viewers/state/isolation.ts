import type * as Core from '../../core-viewers'
import { createFuncRef, createState } from '../../state'
import type { IIsolationAdapter, IsolationApi, VisibilityStatus } from '../../react-viewers/state/sharedIsolation'
import type { IRenderSettingsAdapter, RenderSettingsApi } from '../../react-viewers/state/renderSettings'
import type { IsolationSettings } from '../../react-viewers/webgl/settings'
// The adapters are plain closures over the core; they move into this layer at the flip.
import { createWebglAdapters } from '../../react-viewers/webgl/isolation'
import { createUltraIsolationAdapter } from '../../react-viewers/ultra/isolation'
import { createSettingState } from './settingState'

export type IsolationHandle = IsolationApi & { destroy (): void }
export type RenderSettingsHandle = RenderSettingsApi & { destroy (): void }

/**
 * The framework-neutral twin of `useSharedIsolation`: visibility and
 * isolation state over a viewer adapter. Shared by WebGL and Ultra.
 */
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

/** The framework-neutral twin of `useRenderSettings` (WebGL only). */
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
  // Seed the material with the configured ghost opacity before the state initializes from it;
  // a persisted localStorage value still takes precedence (the state reads it first).
  if (settings?.ghostOpacity !== undefined) viewer.materials.ghostOpacity = settings.ghostOpacity
  const { isolationAdapter, renderSettingsAdapter } = createWebglAdapters(viewer, settings)
  return {
    isolation: createSharedIsolation(isolationAdapter),
    renderSettings: createRenderSettings(renderSettingsAdapter)
  }
}

export function createUltraIsolation (viewer: Core.Ultra.Viewer, showGhostDefault?: boolean) {
  return createSharedIsolation(createUltraIsolationAdapter(viewer, showGhostDefault))
}
