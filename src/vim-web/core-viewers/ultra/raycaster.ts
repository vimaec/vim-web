import * as THREE from "three";
import { Validation } from "../../utils";
import type {IRaycastResult, IRaycaster} from "../shared/raycaster";
import { Element3D } from "./element3d";
import { RpcSafeClient } from "./rpcSafeClient";
import { IReadonlyVimCollection } from "./vimCollection";

export type IUltraRaycastResult = IRaycastResult<Element3D>;
export type IUltraRaycaster = IRaycaster<Element3D>;

/**
 * Represents the result of a hit test operation.
 */
export class UltraRaycastResult implements IUltraRaycastResult {

  /** The model Object hit */
  object: Element3D

  /** The 3D world position of the hit point */
  worldPosition: THREE.Vector3;
  /** The surface normal at the hit point */
  worldNormal: THREE.Vector3;

  constructor(object: Element3D, worldPosition: THREE.Vector3, worldNormal: THREE.Vector3) {
    this.object = object;
    this.worldPosition = worldPosition;
    this.worldNormal = worldNormal;
  }
};


/**
 * @module ultra-webgl-viewer
 */

/**
 * Handles raycasting operations in the Ultra system, enabling picking and
 * interaction with 3D objects in the scene.
 */
export class Raycaster implements IUltraRaycaster {
  private _rpc: RpcSafeClient;
  private _vims: IReadonlyVimCollection;

  /**
   * Creates a new UltraCoreRaycaster instance.
   * 
   * @param {RpcSafeClient} rpc - RPC client for communication with the viewer.
   * @param {IReadonlyVimCollection} vims - Collection of VIM instances to manage.
   */
  constructor(
    rpc: RpcSafeClient,
    vims: IReadonlyVimCollection
  ) {
    this._rpc = rpc;
    this._vims = vims;
  }

  /**
   * Performs a raycast from the camera using normalized screen coordinates.
   * Coordinates must be within [0, 1] for both x and y.
   * 
   * @param {Vector2} position - The normalized screen position for raycasting.
   * @returns {Promise<UltraRaycastResult | undefined>} Promise resolving to hit test result or undefined if no hit.
   */
  async raycastFromScreen(position: THREE.Vector2): Promise<UltraRaycastResult> {
    if(!Validation.isRelativeVector2(position)) return undefined; 

    const test = await this._rpc.RPCPerformHitTest(position);
    if (!test) return undefined;

    const vim = this._vims.getFromHandle(test.vimHandle);
    if (!vim) return undefined;

    const object = vim.getElementFromInstanceIndex(test.nodeIndex);
    if (!object) return undefined;

    return new UltraRaycastResult(
      object,
      test.worldPosition,
      test.worldNormal
    );
  }

  /**
   * Performs a raycast from a specific world position towards a target.
   * 
   * @param {Vector3} position - The target world position for raycasting.
   * @returns {Promise<UltraRaycastResult | undefined>} Promise resolving to hit test result or undefined if no hit.
   */
  async raycastFromWorld(position: THREE.Vector3): Promise<UltraRaycastResult | undefined> {
    throw new Error("raycastFromWorld is not implemented yet");
  }

}