import { THREE } from "../..";

export interface IRaycastResult<T>{
  /** The model Object hit */
  object: T | undefined;

  /** The 3D world position of the hit point */
  worldPosition: THREE.Vector3;
  /** The surface normal at the hit point */
  worldNormal: THREE.Vector3;
}

export interface IRaycaster<T> {
  raycastFromScreen(position: THREE.Vector2): Promise<IRaycastResult<T>>;
  raycastFromWorld(position: THREE.Vector3): Promise<IRaycastResult<T>>;
}




