import * as Core from "../../core-viewers";
import { ISelectable } from "../../core-viewers/webgl";
import { IIsolationAdapter, useSharedIsolation as useSharedIsolation, VisibilityStatus } from "../state/sharedIsolation";
import { IsolationSettings } from "../webgl/settings";

export function useWebglIsolation(viewer: Core.Webgl.Viewer, initialState?: IsolationSettings){
  const adapter = createWebglIsolationAdapter(viewer, initialState)
  return useSharedIsolation(adapter)
}

function createWebglIsolationAdapter(viewer: Core.Webgl.Viewer, initialState?: IsolationSettings): IIsolationAdapter {
  var ghost: boolean = initialState?.showGhost ?? false;
  var transparency: boolean = initialState?.transparency ?? true;
  var rooms: boolean = initialState?.showRooms ?? false;

  function updateMaterials(){
    const m = viewer.materials
    viewer.renderer.modelMaterial = new Core.Webgl.MaterialSet(
      m.modelOpaqueMaterial,
      transparency ? m.modelTransparentMaterial : m.modelOpaqueMaterial,
      ghost ? m.ghostMaterial : undefined
    )
  }

  // Don't call updateMaterials() immediately - let RenderScene default handle initial state

  function updateVisibility(elements: 'all' | ISelectable[], predicate: (object: ISelectable) => boolean){
    if(elements === 'all'){
      for(let v of viewer.vims){
        for(let o of v.getAllElements()){
          if(o.type === 'Element3D'){
            o.visible = o.isRoom ? rooms : predicate(o);
          }
        }
      }
    } else {
      for(let o of elements){
        o.visible = o.isRoom ? rooms : predicate(o);
      }
    }
  }

  return {
    onVisibilityChange: viewer.renderer.onSceneUpdated,
    onSelectionChanged: viewer.selection.onSelectionChanged,
    computeVisibility: () => getVisibilityState(viewer),
    hasSelection: () => viewer.selection.any(),
    hasVisibleSelection: () => viewer.selection.any() && viewer.selection.getAll().every(o => o.visible),
    hasHiddenSelection: () => viewer.selection.any() && viewer.selection.getAll().every(o => !o.visible),

    clearSelection: () => viewer.selection.clear(),

    isolateSelection: () => updateVisibility('all', o => viewer.selection.has(o)),
    hideSelection: () => {
      updateVisibility(viewer.selection.getAll(), o => false)
    },
    showSelection: () => {
      updateVisibility(viewer.selection.getAll(), o => true)
    },

    hideAll: () => {
      updateVisibility('all', o => false)
    },
    showAll: () => {
      updateVisibility('all', o => true)
    },

    isolate: (instances: number[]) => {
      const set = new Set(instances)
      updateVisibility('all', o => o.instances.some(i => set.has(i)))
    },
    show: (instances: number[]) => {
      for(let i of instances){
        for(let v of viewer.vims){
          const o = v.getElement(i)
          o.visible = o.isRoom ? rooms : true
        }
      }
    },

    hide: (instances: number[]) => {
      for(let i of instances){
        for(let v of viewer.vims){
          const o = v.getElement(i)
            o.visible = o.isRoom ? rooms : false
        }
      }
    },
    
    showGhost: (show: boolean) => {
      ghost = show;
      updateMaterials();
    },    

    getGhostOpacity: () => viewer.materials.ghostOpacity,
    setGhostOpacity: (opacity: number) => viewer.materials.ghostOpacity = opacity,

    getShowGhost: () => ghost,
    getTransparency: () => transparency,
    getOutlineEnabled: () => viewer.renderer.outlineEnabled,
    getOutlineQuality: () => {
      const scale = viewer.renderer.outlineScale
      if (scale >= 2) return 'high'
      if (scale >= 1) return 'medium'
      return 'low'
    },
    getOutlineThickness: () => viewer.materials.outlineThickness,
    getSelectionFillMode: () => viewer.materials.selectionFillMode,
    getSelectionOverlayOpacity: () => viewer.materials.selectionOverlayOpacity,

    setTransparency: (enabled: boolean) => {
      transparency = enabled;
      updateMaterials();
    },

    setOutlineEnabled: (enabled: boolean) => {
      viewer.renderer.outlineEnabled = enabled
    },
    setOutlineQuality: (quality: string) => {
      const scaleMap: Record<string, number> = { low: 0.5, medium: 1, high: 2 }
      viewer.renderer.outlineScale = scaleMap[quality] ?? 1
    },
    setOutlineThickness: (thickness: number) => {
      viewer.materials.outlineThickness = thickness
    },
    setSelectionFillMode: (mode: string) => {
      viewer.materials.selectionFillMode = mode as Core.Webgl.SelectionFillMode
      viewer.renderer.selectionFillMode = mode as Core.Webgl.SelectionFillMode
    },
    setSelectionOverlayOpacity: (opacity: number) => {
      viewer.materials.selectionOpacity = opacity
      viewer.materials.selectionOverlayOpacity = opacity
    },

    getShowRooms: () => rooms,
    setShowRooms: (show: boolean) => {
      if(rooms !== show){
        rooms = show;
        updateVisibility('all', o => o.visible)
      }
    },
  };
}

function getVisibilityState(viewer: Core.Webgl.Viewer): VisibilityStatus {
  let all = true;
  let none = true;
  let allButSelectionFlag = true;
  let onlySelectionFlag = true;
  
  for (let v of viewer.vims) {
    for (let o of v.getAllElements()) {
      if (o.type === "Element3D") {
        // Check for all and none states
        all = all && o.visible;
        none = none && !o.visible;
        
        // Check if this object is selected
        const isSelected = viewer.selection.has(o);
        
        // For allButSelection: All non-selected objects should be visible, all selected should be invisible
        if (isSelected && o.visible) allButSelectionFlag = false;
        if (!isSelected && !o.visible) allButSelectionFlag = false;
        
        // For onlySelection: All selected objects should be visible, all non-selected should be invisible
        if (isSelected && !o.visible) onlySelectionFlag = false;
        if (!isSelected && o.visible) onlySelectionFlag = false;
      }
    }
  }
  
  if (all) return 'all';
  if (none) return 'none';
  if (allButSelectionFlag) return 'allButSelection';
  if (onlySelectionFlag) return 'onlySelection';
  
  // If none of the above conditions are met, it must be 'some'
  return 'some';
}