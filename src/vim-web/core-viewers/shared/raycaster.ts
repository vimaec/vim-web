import { THREE } from "../..";

export interface IRaycastResult<T>{
  /** The model Object hit */
  object: T | undefined;

  /** The 3D world position of the hit point */
  worldPosition: THREE.Vector3;
  /** The surface normal at the hit point */
  worldNormal: THREE.Vector3;
}

/**
 * Interface for raycasting against a 3D scene.
 * @template T - The type of object to raycast against.
 */
export interface IRaycaster<T> {
  /**
   * Raycasts from camera to the screen position to find the first object hit.
   * @param position - The screen position to raycast from.
   * @returns A promise that resolves to the raycast result.
   */
  raycastFromScreen(position: THREE.Vector2): Promise<IRaycastResult<T>>;

  /**
   * Raycasts from camera to world position to find the first object hit.
   * @param position - The world position to raycast from.
   * @returns A promise that resolves to the raycast result.
   */
  raycastFromWorld(position: THREE.Vector3): Promise<IRaycastResult<T>>;

  /**
   * GPU-based raycast that returns only the world position of the first hit.
   * Optimized for camera operations where object identification is not needed.
   * @param position - Screen position in 0-1 range (0,0 is top-left)
   * @returns World position of the first hit, or undefined if no geometry at position
   */
  raycastWorldPosition?(position: THREE.Vector2): THREE.Vector3 | undefined;
}




