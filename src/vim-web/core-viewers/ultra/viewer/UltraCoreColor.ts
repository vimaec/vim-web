import { RGBA32 } from "../../utils/math3d";
import { ColorManager } from "./colorManager";

/**
 * Represents a handle to a color in the color management system.
 * This class provides access to color components and manages the lifecycle of color instances.
 */
export class UltraCoreColor {
  private _manager: ColorManager;
  /** Unique identifier for the color instance */
  readonly id: number;
  /** The RGBA color value */
  readonly color: RGBA32;
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
    return this.color.hex;
  }

  /**
   * Gets the red component of the color.
   * @returns {number} The red component value in the range [0-255].
   */
  get r(): number {
    return this.color.r;
  }

  /**
   * Gets the green component of the color.
   * @returns {number} The green component value in the range [0-255].
   */
  get g(): number {
    return this.color.g;
  }

  /**
   * Gets the blue component of the color.
   * @returns {number} The blue component value in the range [0-255].
   */
  get b(): number {
    return this.color.b;
  }

  /**
   * Gets the alpha (opacity) component of the color.
   * @returns {number} The alpha component value in the range [0-255].
   */
  get a(): number {
    return this.color.a;
  }

  /**
   * Creates a new ColorHandle instance.
   * @param {RGBA32} color - The RGBA color value.
   * @param {number} serverId - The unique identifier assigned by the server.
   * @param {ColorManager} manager - The color manager instance that manages this color handle.
   */
  constructor(color: RGBA32, serverId: number, manager: ColorManager) {
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