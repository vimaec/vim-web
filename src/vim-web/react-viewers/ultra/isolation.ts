import { IsolationAdapter, useSharedIsolation as useSharedIsolation, VisibilityStatus } from "../state/sharedIsolation";
import * as Core from "../../core-viewers";
import { useStateRef } from "../helpers/reactUtils";

import NodeState = Core.Ultra.NodeState
import Viewer = Core.Ultra.Viewer
import Vim = Core.Ultra.Vim
import Element3D = Core.Ultra.Element3D

export function useUltraIsolation(viewer: Viewer){
  const adapter = createAdapter(viewer)
  return useSharedIsolation(adapter)
}

function createAdapter(viewer: Viewer): IsolationAdapter {

  const ghost = useStateRef<boolean>(false);

  // Helper function to hide objects in ghost or hidden state
  const hide = (objects: Element3D[] | 'all') =>{
    const state = ghost.get() ? NodeState.GHOSTED : NodeState.HIDDEN
    if(objects === 'all'){
      viewer.vims.getAll().forEach(vim => {vim.nodeState.setAllNodesState(state, true)})
      return
    }
    objects.forEach(obj => {obj.state = state})
  }

  return {
    onVisibilityChange  : viewer.renderer.onSceneUpdated,
    onSelectionChanged: viewer.selection.onSelectionChanged,
    computeVisibility: () => getVisibilityState(viewer),
    hasSelection: () => viewer.selection.any(),
    hasVisibleSelection: () => checkSelectionState(viewer, s => s === 'visible' || s === 'highlighted'),
    hasHiddenSelection: () => checkSelectionState(viewer, s => s === 'hidden' || s === 'ghosted'),

    clearSelection: () => viewer.selection.clear(),

    isolateSelection: () => {
      hide('all') 

      for(const obj of viewer.selection.getAll()){
        obj.state = NodeState.HIGHLIGHTED
      }
    },
    hideSelection: () => {
      const objs = viewer.selection.getAll()
      hide(objs)
    },
    showSelection: () => {
      viewer.selection.getAll().forEach(obj => {
        obj.state = NodeState.VISIBLE
      })
    },

    hideAll: () => {
      hide('all')
    },
    showAll: () => {
      for(const vim of viewer.vims.getAll()){
        vim.nodeState.setAllNodesState(NodeState.VISIBLE, true)
      }
      viewer.selection.getAll().forEach(obj => {
        obj.state = NodeState.HIGHLIGHTED
      })
    },

    isolate: (instances: number[]) => {
      hide('all') // Hide all objects
      viewer.selection.getAll().forEach(obj => {
        obj.state = NodeState.HIGHLIGHTED
      })
    },
    show: (instances: number[]) => {
      for(const vim of viewer.vims.getAll()){
        for(const i of instances){
          vim.getElementFromInstanceIndex(i).state = NodeState.VISIBLE
        }
      }
    },

    hide: (instances: number[]) => {
      for(const vim of viewer.vims.getAll()){
        for(const i of instances){
          const obj = vim.getElementFromInstanceIndex(i)
          hide([obj])
        }
      }
      const objs = viewer.selection.getAll()
      hide(objs)
    },
    showGhost: (show: boolean) => {
      console.log('showGhost', show)
      ghost.set(show)
      
      for(const vim of viewer.vims.getAll()){
        if(show){
          vim.nodeState.replaceState(NodeState.HIDDEN, NodeState.GHOSTED)
        } else {
          vim.nodeState.replaceState(NodeState.GHOSTED, NodeState.HIDDEN)
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

function checkSelectionState(viewer: Viewer, test: (state: NodeState) => boolean): boolean {
  if(!viewer.selection.any()){
    return false
  }
  
  return viewer.selection.getAll().every(obj => test(obj.state))
}

function getVisibilityState(viewer: Viewer): VisibilityStatus {
  let all = true;
  let none = true;
  let allButSelectionFlag = true;
  let onlySelectionFlag = true;

  for (let v of viewer.vims.getAll()) {
    const allVisible = v.nodeState.areAllInState([NodeState.VISIBLE, NodeState.HIGHLIGHTED])
    const allHidden = v.nodeState.areAllInState([NodeState.HIDDEN, NodeState.GHOSTED])

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

function onlySelection(viewer: Viewer, vim: Vim): boolean {
  return false
  /*
  const selectedInstances = viewer.selection.get().get(vim)
  if(selectedInstances === undefined) return false

  // Base state should be hidden or ghosted
  const baseState = vim.nodeState.getDefaultState()
  if(baseState === 'visible') return false
  if(baseState === 'highlighted') return false

  // Assumes that not all instances are selected
  const visibleInstances = vim.nodeState.getNodesInState(UltraVimNodeState.VISIBLE)
  if(visibleInstances === 'all') return false

  // Check that visible set === selected set
  const visibleSet = new Set(visibleInstances)
  if(!visibleSet.isSubsetOf(selectedInstances)) return false
  if(!visibleSet.isSupersetOf(selectedInstances)) return false
  
  return true
  */
}

function allButSelection(viewer: Viewer, vim: Vim): boolean {
  return false
  /*
  const selectedInstances = viewer.selection.get().get(vim)
  if(selectedInstances === undefined) return false
  
  // Base state should be visible or highlighted
  const baseState = vim.nodeState.getDefaultState()
  if(baseState === 'hidden') return false
  if(baseState === 'ghosted') return false

  // Assumes that not all instances are selected
  const hiddenInstances = vim.nodeState.getNodesInState(UltraVimNodeState.HIDDEN)
  const ghostedInstances = vim.nodeState.getNodesInState(UltraVimNodeState.GHOSTED)
  if(hiddenInstances === 'all') return false
  if(ghostedInstances === 'all') return false

  // Check that visible set === selected set
  const hiddenSet = new Set([...hiddenInstances, ...ghostedInstances])
  if(!hiddenSet.isSubsetOf(selectedInstances)) return false
  if(!hiddenSet.isSupersetOf(selectedInstances)) return false

  return true
  */
}
