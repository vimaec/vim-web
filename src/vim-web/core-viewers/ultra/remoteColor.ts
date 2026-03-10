import { ColorManager } from './colorManager';
import * as THREE from 'three';

/**
 * Public interface for a remote color handle.
 * Provides read-only access to color properties and lifecycle management.
 */
export interface IRemoteColor {
  readonly id: number
  readonly color: THREE.Color
  readonly disposed: boolean
  readonly hex: number
  dispose(): void
}

/**
 * @internal
 */
export class RemoteColor implements IRemoteColor {
  private _manager: ColorManager;
  /** Unique identifier for the color instance */
  readonly id: number;
  /** The RGBA color value */
  readonly color: THREE.Color;
  private _disposed = false;

  /**
   * Indicates whether the color handle has been disposed.
   * @returns {boolean} True if the color handle has been disposed, false otherwise.
   */
  get disposed(): boolean {
    return this._disposed;
  }

  /**
   * Gets the hexadecimal representation of the color.
   * @returns {number} The color value as a hexadecimal number.
   */
  get hex(): number {
    return this.color.getHex();
  }

  /**
   * Creates a new ColorHandle instance.
   * @param {RGBA32} color - The RGBA color value.
   * @param {number} serverId - The unique identifier assigned by the server.
   * @param {ColorManager} manager - The color manager instance that manages this color handle.
   */
  constructor(color: THREE.Color, serverId: number, manager: ColorManager) {
    this._manager = manager;
    this.color = color;
    this.id = serverId;
  }

  /**
   * Disposes of the color handle and releases associated resources.
   * Once disposed, the color handle cannot be used anymore.
   * Multiple calls to dispose are safely ignored.
   */
  dispose(): void {
    if (this._disposed) return; // Prevent multiple disposals
    this._manager.destroy(this);
    this._disposed = true;
  }
}