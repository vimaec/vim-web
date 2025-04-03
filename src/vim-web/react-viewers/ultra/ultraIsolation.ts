import { useEffect } from "react";
import { WebglModelObject, WebglCoreViewer } from "../../core-viewers/webgl";
import { SignalDispatcher } from "ste-signals";
import { IsolationAdapter, useSharedIsolation as useSharedIsolation, VisibilityStatus } from "../state/sharedIsolation";
import { UltraCoreViewer, UltraVim, UltraVimNodeState } from "../../core-viewers/ultra";
import { useStateRef } from "../helpers/reactUtils";
import { ArrayEquals } from "../helpers/data";

export function useUltraIsolation(viewer: UltraCoreViewer){
  const adapter = createAdapter(viewer)
  return useSharedIsolation(adapter)
}

function createAdapter(viewer: UltraCoreViewer): IsolationAdapter {

  const ghost = useStateRef<boolean>(false);
  const hide = (vim: UltraVim, instances: ForEachable<number> | 'all') =>{
    if(ghost.get()){
      vim.ghost(instances)
    } else {
      vim.hide(instances)
    }
  }

  return {
    onVisibilityChange  : viewer.renderer.onSceneUpdated,
    onSelectionChanged: viewer.selection.onValueChanged,
    computeVisibility: () => getVisibilityState(viewer),
    hasSelection: () => viewer.selection.count > 0,
    isSelectionVisible: () => checkSelectionState(viewer, s => s === 'visible' || s === 'highlighted'),
    isSelectionHidden: () => checkSelectionState(viewer, s => s === 'hidden' || s === 'ghosted'),

    clearSelection: () => viewer.selection.clear(),

    isolateSelection: () => {
      for(const vim of viewer.vims.getAll()){
        hide(vim, 'all') 
      }

      for(const [vim, instances] of viewer.selection.get().entries()){
        vim.highlight(instances) // selection should be highlighted
      }
    },
    hideSelection: () => {
      for(const [vim, instances] of viewer.selection.get().entries()){
        hide(vim, instances)
      }
    },
    showSelection: () => {
      for(const [vim, instances] of viewer.selection.get().entries()){
        vim.highlight(instances) // selection should be highlighted
      }
    },

    hideAll: () => {
      for(const vim of viewer.vims.getAll()){
        hide(vim, 'all')
      }
    },
    showAll: () => {
      for(const vim of viewer.vims.getAll()){
        vim.show('all')
      }
      // Reapply selection
      for(const [vim, instances] of viewer.selection.get().entries()){
        vim.highlight(instances)
      }
    },

    isolate: (instances: number[]) => {
      for(const vim of viewer.vims.getAll()){
        hide(vim, instances)
        vim.show(instances)
      }
    },
    show: (instances: number[]) => {
      for(const vim of viewer.vims.getAll()){
        vim.show(instances)
      }
    },

    hide: (instances: number[]) => {
      for(const vim of viewer.vims.getAll()){
        hide(vim, instances)
      }
    },
    showGhost: (show: boolean) => {
      console.log("showGhost", show)
      ghost.set(show)
      
      for(const vim of viewer.vims.getAll()){
        if(show){
          vim.replace('hidden', 'ghosted')
        } else {
          vim.replace('ghosted', 'hidden' )
        }
      }
    },

    getGhostOpacity: () => viewer.renderer.ghostColor.a,
    setGhostOpacity: (opacity: number) => {
      const c = viewer.renderer.ghostColor.clone()
      c.a = opacity
      viewer.renderer.ghostColor = c
    },

    getShowRooms: () => true,
    setShowRooms: (show: boolean) => {console.log("setShowRooms not implemented")},


  };
}

function checkSelectionState(viewer: UltraCoreViewer, test: (state: UltraVimNodeState) => boolean): boolean {
  if(viewer.selection.count === 0){
    return false
  }
  for(const [vim, instances] of viewer.selection.get().entries()){
    for(const i of instances){
      if(!test(vim.getState(i))){
        return false
      }
    }
  }
  return true
}

function getVisibilityState(viewer: UltraCoreViewer): VisibilityStatus {
  console.log('getVisibilityState')
  let all = true;
  let none = true;
  let allButSelectionFlag = true;
  let onlySelectionFlag = true;

  for (let v of viewer.vims.getAll()) {
    const allVisible = v.areAll(['visible', 'highlighted'])
    const allHidden = v.areAll(['hidden','ghosted'])

    all = all && allVisible
    none = none && allHidden
    onlySelectionFlag = onlySelection(viewer, v)
    allButSelectionFlag = allButSelection(viewer, v)
  }
  
  if (all) return 'all';
  if (none) return 'none';
  if (allButSelectionFlag) return 'allButSelection';
  if (onlySelectionFlag) return 'onlySelection';
  
  // If none of the above conditions are met, it must be 'some'
  return 'some';
}

function onlySelection(viewer: UltraCoreViewer, vim: UltraVim): boolean {
  const selectedInstances = viewer.selection.get().get(vim)
  if(selectedInstances === undefined) return false

  // Base state should be hidden or ghosted
  const baseState = vim.getDefaultState()
  if(baseState === 'visible') return false
  if(baseState === 'highlighted') return false

  // Assumes that not all instances are selected
  const visibleInstances = vim.getAll('visible')
  if(visibleInstances === 'all') return false

  // Check that visible set === selected set
  const visibleSet = new Set(visibleInstances)
  if(!visibleSet.isSubsetOf(selectedInstances)) return false
  if(!visibleSet.isSupersetOf(selectedInstances)) return false
  
  return true
}

function allButSelection(viewer: UltraCoreViewer, vim: UltraVim): boolean {
  const selectedInstances = viewer.selection.get().get(vim)
  if(selectedInstances === undefined) return false
  
  // Base state should be visible or highlighted
  const baseState = vim.getDefaultState()
  if(baseState === 'hidden') return false
  if(baseState === 'ghosted') return false

  // Assumes that not all instances are selected
  const hiddenInstances = vim.getAll('hidden')
  const ghostedInstances = vim.getAll('ghosted')
  if(hiddenInstances === 'all') return false
  if(ghostedInstances === 'all') return false

  // Check that visible set === selected set
  const hiddenSet = new Set([...hiddenInstances, ...ghostedInstances])
  if(!hiddenSet.isSubsetOf(selectedInstances)) return false
  if(!hiddenSet.isSupersetOf(selectedInstances)) return false
  
  return true
}
