import * as THREE from 'three'

export type ActionType = 'main' | 'double' | 'idle'
export type ActionModifier = 'none' | 'shift' | 'ctrl'

export interface IRaycasterAdaper {
  getElement() : number | undefined
  getInstances() : number[] | undefined
}

/**
 * Represents an input action with its position and modifiers.
 */
export class InputAction {
  readonly position: THREE.Vector2
  readonly modifier: ActionModifier
  readonly type: ActionType
  readonly _raycaster: IRaycasterAdaper

  constructor (
    type: ActionType,
    modifier: ActionModifier,
    position: THREE.Vector2,
    raycaster: IRaycasterAdaper 
  ) {
    this.type = type
    this.modifier = modifier
    this.position = position
    this._raycaster = raycaster
  }
  
  getElement(){
    return this._raycaster.getElement()
  }
  
  getInstances(){
    return this._raycaster.getInstances()
  }
}