import { IsolationAdapter, useSharedIsolation as useSharedIsolation, VisibilityStatus } from "../state/sharedIsolation";
import * as Core from "../../core-viewers";
import { useStateRef } from "../helpers/reactUtils";

import VisibilityState = Core.Ultra.VisibilityState
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
    const state = ghost.get() ? VisibilityState.GHOSTED : VisibilityState.HIDDEN
    if(objects === 'all'){
      viewer.vims.getAll().forEach(vim => {vim.visibility.setStateForAll(state)})
      return
    }

    for(const obj of objects){
      if(viewer.selection.has(obj)){
        obj.state = state == VisibilityState.GHOSTED
         ? VisibilityState.GHOSTED_HIGHLIGHTED
         : VisibilityState.HIDDEN_HIGHLIGHTED
      }
      else{
        obj.state = state
      }
    }
  }

  return {
    onVisibilityChange  : viewer.renderer.onSceneUpdated,
    onSelectionChanged: viewer.selection.onSelectionChanged,
    computeVisibility: () => getVisibilityState(viewer),
    hasSelection: () => viewer.selection.any(),
    hasVisibleSelection: () => checkSelectionState(viewer, s => s === VisibilityState.VISIBLE || s === VisibilityState.HIGHLIGHTED),
    hasHiddenSelection: () => checkSelectionState(viewer, s => s === VisibilityState.HIDDEN || s === VisibilityState.GHOSTED),

    clearSelection: () => viewer.selection.clear(),

    isolateSelection: () => {
      hide('all') 

      for(const obj of viewer.selection.getAll()){
        obj.state = VisibilityState.HIGHLIGHTED
      }
    },
    hideSelection: () => {
      const objs = viewer.selection.getAll()
      hide(objs)
    },
    showSelection: () => {
      viewer.selection.getAll().forEach(obj => {
        obj.state = VisibilityState.VISIBLE
      })
    },

    hideAll: () => {
      hide('all')
    },
    showAll: () => {
      for(const vim of viewer.vims.getAll()){
        vim.visibility.setStateForAll(VisibilityState.VISIBLE)
      }
      viewer.selection.getAll().forEach(obj => {
        obj.state = VisibilityState.HIGHLIGHTED
      })
    },

    // TODO: Change this api to use elements
    isolate: (instances: number[]) => {
      hide('all') // Hide all objects
      viewer.selection.getAll().forEach(obj => {
        obj.state = VisibilityState.HIGHLIGHTED
      })
    },
    show: (instances: number[]) => {
      for(const vim of viewer.vims.getAll()){
        for(const i of instances){
          vim.getElement(i).state = VisibilityState.VISIBLE
        }
      }
    },

    hide: (instances: number[]) => {
      for(const vim of viewer.vims.getAll()){
        for(const i of instances){
          const obj = vim.getElement(i)
          hide([obj])
        }
      }
      const objs = viewer.selection.getAll()
      hide(objs)
    },
    showGhost: (show: boolean) => {
      ghost.set(show)
      
      for(const vim of viewer.vims.getAll()){
        if(show){
          vim.visibility.replaceState(VisibilityState.HIDDEN, VisibilityState.GHOSTED)
        } else {
          vim.visibility.replaceState(VisibilityState.GHOSTED, VisibilityState.HIDDEN)
        }
      }
    },
    enableTransparency: (enable: boolean) => {
      console.log("enableTransparency not implemented")
    },

    getGhostOpacity: () => viewer.renderer.ghostOpacity,
    setGhostOpacity: (opacity: number) => {
      viewer.renderer.ghostOpacity = opacity
    },

    getShowRooms: () => true,
    setShowRooms: (show: boolean) => {console.log("setShowRooms not implemented")},


  };
}

function checkSelectionState(viewer: Viewer, test: (state: VisibilityState) => boolean): boolean {
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
    const allVisible = v.visibility.areAllInState([VisibilityState.VISIBLE, VisibilityState.HIGHLIGHTED])
    const allHidden = v.visibility.areAllInState([VisibilityState.HIDDEN, VisibilityState.GHOSTED])

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

//returns true if only the selection is visible
function onlySelection(viewer: Viewer, vim: Vim): boolean {
  return false
}

//returns true if only the selection is hidden
function allButSelection(viewer: Viewer, vim: Vim): boolean {
  return false
}
