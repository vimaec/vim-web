import * as Core from '../../core-viewers'
import { ISelectable } from '../../core-viewers/webgl'
import { IIsolationAdapter, useSharedIsolation, VisibilityStatus } from '../state/sharedIsolation'
import { IRenderSettingsAdapter, useRenderSettings } from '../state/renderSettings'
import { IsolationSettings } from '../webgl/settings'

export function useWebglIsolation(viewer: Core.Webgl.Viewer, initialState?: IsolationSettings) {
  const { isolationAdapter, renderSettingsAdapter } = createWebglAdapters(viewer, initialState)
  const isolation = useSharedIsolation(isolationAdapter)
  const renderSettings = useRenderSettings(renderSettingsAdapter)
  return { isolation, renderSettings }
}

function createWebglAdapters(viewer: Core.Webgl.Viewer, initialState?: IsolationSettings) {
  // Shared closure state — read by both adapters (e.g. showGhost triggers updateMaterials).
  let ghost = initialState?.showGhost ?? false
  let showTransparent = initialState?.showTransparent ?? true
  let rooms = initialState?.showRooms ?? false

  function updateMaterials() {
    const m = viewer.materials
    viewer.renderer.modelMaterial = new Core.Webgl.MaterialSet(
      m.modelOpaqueMaterial,
      showTransparent ? m.modelTransparentMaterial : m.modelOpaqueMaterial,
      ghost ? m.ghostMaterial : undefined
    )
  }

  function updateVisibility(elements: 'all' | ISelectable[], predicate: (object: ISelectable) => boolean) {
    if (elements === 'all') {
      for (const v of viewer.vims) {
        for (const o of v.getAllElements()) {
          if (o.type === 'Element3D') {
            o.visible = o.isRoom ? rooms : predicate(o)
          }
        }
      }
    } else {
      for (const o of elements) {
        o.visible = o.isRoom ? rooms : predicate(o)
      }
    }
  }

  const isolationAdapter: IIsolationAdapter = {
    onVisibilityChange: viewer.renderer.onSceneUpdated,
    onSelectionChanged: viewer.selection.onSelectionChanged,
    computeVisibility: () => getVisibilityState(viewer),
    hasSelection: () => viewer.selection.any(),
    hasVisibleSelection: () => viewer.selection.any() && viewer.selection.getAll().some(o => o.visible),
    hasHiddenSelection: () => viewer.selection.any() && viewer.selection.getAll().some(o => !o.visible),

    clearSelection: () => viewer.selection.clear(),

    isolateSelection: () => updateVisibility('all', o => viewer.selection.has(o)),
    hideSelection: () => updateVisibility(viewer.selection.getAll(), () => false),
    showSelection: () => updateVisibility(viewer.selection.getAll(), () => true),

    hideAll: () => updateVisibility('all', () => false),
    showAll: () => updateVisibility('all', () => true),

    isolate: (instances: number[]) => {
      const set = new Set(instances)
      updateVisibility('all', o => o.instances.some(i => set.has(i)))
    },
    show: (instances: number[]) => {
      for (const i of instances) {
        for (const v of viewer.vims) {
          const o = v.getElement(i)
          if (o) o.visible = o.isRoom ? rooms : true
        }
      }
    },
    hide: (instances: number[]) => {
      for (const i of instances) {
        for (const v of viewer.vims) {
          const o = v.getElement(i)
          if (o) o.visible = o.isRoom ? rooms : false
        }
      }
    },

    showGhost: (show: boolean) => {
      ghost = show
      updateMaterials()
    },
    getShowGhost: () => ghost,
    getGhostOpacity: () => viewer.materials.ghostOpacity,
    setGhostOpacity: (opacity: number) => { viewer.materials.ghostOpacity = opacity },
  }

  const renderSettingsAdapter: IRenderSettingsAdapter = {
    getShowTransparent: () => showTransparent,
    setShowTransparent: (enabled: boolean) => {
      showTransparent = enabled
      updateMaterials()
    },
    getTransparentOpacity: () => viewer.materials.transparentOpacity,
    setTransparentOpacity: (opacity: number) => { viewer.materials.transparentOpacity = opacity },
    getOutlineEnabled: () => viewer.renderer.outlineEnabled,
    setOutlineEnabled: (enabled: boolean) => { viewer.renderer.outlineEnabled = enabled },
    getOutlineQuality: () => {
      const scale = viewer.renderer.outlineScale
      if (scale >= 2) return 'high'
      if (scale >= 1) return 'medium'
      return 'low'
    },
    setOutlineQuality: (quality: string) => {
      const scaleMap: Record<string, number> = { low: 0.5, medium: 1, high: 2 }
      viewer.renderer.outlineScale = scaleMap[quality] ?? 1
    },
    getOutlineThickness: () => viewer.materials.outlineThickness,
    setOutlineThickness: (thickness: number) => { viewer.materials.outlineThickness = thickness },
    getSelectionFillMode: () => viewer.materials.selectionFillMode,
    setSelectionFillMode: (mode: string) => {
      viewer.renderer.selectionFillMode = mode as Core.Webgl.SelectionFillMode
    },
    getSelectionOverlayOpacity: () => viewer.materials.selectionOverlayOpacity,
    setSelectionOverlayOpacity: (opacity: number) => {
      viewer.materials.selectionOpacity = opacity
      viewer.materials.selectionOverlayOpacity = opacity
    },
    getShowRooms: () => rooms,
    setShowRooms: (show: boolean) => {
      if (rooms !== show) {
        rooms = show
        updateVisibility('all', o => o.visible)
      }
    },
  }

  return { isolationAdapter, renderSettingsAdapter }
}

function getVisibilityState(viewer: Core.Webgl.Viewer): VisibilityStatus {
  let all = true
  let none = true

  for (const v of viewer.vims) {
    for (const o of v.getAllElements()) {
      if (o.type === 'Element3D') {
        if (o.visible) none = false
        else all = false
        if (!all && !none) return 'some'
      }
    }
  }

  if (all) return 'all'
  if (none) return 'none'
  return 'some'
}
