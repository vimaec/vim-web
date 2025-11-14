import * as Core from "../../core-viewers";
import { Element3D, Selectable } from "../../core-viewers/webgl";
import { IsolationAdapter, useSharedIsolation as useSharedIsolation, VisibilityStatus } from "../state/sharedIsolation";

export function useWebglIsolation(viewer: Core.Webgl.Viewer){
  const adapter = createWebglIsolationAdapter(viewer)
  return useSharedIsolation(adapter)
}

function createWebglIsolationAdapter(viewer: Core.Webgl.Viewer): IsolationAdapter {
  var transparency: boolean = true;
  var ghost: boolean = false;
  var rooms: boolean = false;

  function updateMaterials(){
    viewer.renderer.modelMaterial =
        ghost ? [viewer.materials.simple, viewer.materials.ghost]
      : transparency ? undefined 
      : viewer.materials.simple
  }

  function updateVisibility(elements: 'all' | Selectable[], predicate: (object: Selectable) => boolean){
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
    
    enableTransparency: (enable: boolean) => {
      if(transparency !== enable){
        transparency = enable;
        updateMaterials();
      };
    },

    showGhost: (show: boolean) => {
      ghost = show;
      updateMaterials();
    },    

    getGhostOpacity: () => viewer.materials.ghostOpacity,
    setGhostOpacity: (opacity: number) => viewer.materials.ghostOpacity = opacity,

    getShowRooms: () => rooms,
    setShowRooms: (show: boolean) => {
      if(rooms !== show){
        rooms = show;
        updateVisibility('all', o => o.visible);arguments
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