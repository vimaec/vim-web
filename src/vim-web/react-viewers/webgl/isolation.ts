import * as Core from "../../core-viewers";
import { IsolationAdapter, useSharedIsolation as useSharedIsolation, VisibilityStatus } from "../state/sharedIsolation";

export function useWebglIsolation(viewer: Core.Webgl.Viewer){
  const adapter = createWebglIsolationAdapter(viewer)
  return useSharedIsolation(adapter)
}

function createWebglIsolationAdapter(viewer: Core.Webgl.Viewer): IsolationAdapter {
  
  return {
    onVisibilityChange: viewer.renderer.onSceneUpdated,
    onSelectionChanged: viewer.selection.onSelectionChanged,
    computeVisibility: () => getVisibilityState(viewer),
    hasSelection: () => viewer.selection.any(),
    isSelectionVisible: () => viewer.selection.any() && viewer.selection.getAll().every(o => o.visible),
    isSelectionHidden: () => viewer.selection.any() && viewer.selection.getAll().every(o => !o.visible),

    clearSelection: () => viewer.selection.clear(),

    isolateSelection: () => updateAllVisibility(viewer, o => viewer.selection.has(o)),
    hideSelection: () => {
      viewer.selection.getAll().forEach(o => o.visible = false)
    },
    showSelection: () => {
      viewer.selection.getAll().forEach(o => o.visible = true)
    },

    hideAll: () => {
      updateAllVisibility(viewer, o => false)
    },
    showAll: () => {
      updateAllVisibility(viewer, o => true)
    },

    isolate: (instances: number[]) => {
      const set = new Set(instances)
      updateAllVisibility(viewer, o => o.instances.some(i => set.has(i)))
    },
    show: (instances: number[]) => {
      for(let i of instances){
        for(let v of viewer.vims){
          const o = v.getObjectFromInstance(i)
            o.visible = true
        }
      }
    },

    hide: (instances: number[]) => {
      for(let i of instances){
        for(let v of viewer.vims){
          const o = v.getObjectFromInstance(i)
            o.visible = false;
        }
      }
    },

    
    showGhost: (show: boolean) => {
      viewer.renderer.modelMaterial = show
      ? [viewer.materials.simple, viewer.materials.ghost]
      : undefined
    },

    getGhostOpacity: () => viewer.materials.ghostOpacity,
    setGhostOpacity: (opacity: number) => viewer.materials.ghostOpacity = opacity,

    getShowRooms: () => true,
    setShowRooms: (show: boolean) => {console.log("setShowRooms not implemented")},


  };
}

function updateAllVisibility(viewer: Core.Webgl.Viewer, predicate: (object: Core.Webgl.Element3D) => boolean){
 for(let v of viewer.vims){
    for(let o of v.getAllObjects()){
      if(o.type === "WebglModelObject"){
        o.visible = predicate(o)
      }
    }
  }
}

function getVisibilityState(viewer: Core.Webgl.Viewer): VisibilityStatus {
  let all = true;
  let none = true;
  let allButSelectionFlag = true;
  let onlySelectionFlag = true;
  
  for (let v of viewer.vims) {
    for (let o of v.getAllObjects()) {
      if (o.type === "WebglModelObject") {
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