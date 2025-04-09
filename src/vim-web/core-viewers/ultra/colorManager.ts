import { MaterialHandles } from './rpcClient'
import { RpcSafeClient } from './rpcSafeClient'
import { RemoteColor } from './remoteColor'
import { RGBA32 } from './rpcTypes'

const MAX_BATCH_SIZE = 3000

/**
 * Manages the creation, caching, and deletion of color instances.
 * Handles batched deletion of colors to optimize RPC calls.
 */
export class ColorManager {
  private _rpc: RpcSafeClient
  private _hexToColor = new Map<number, RemoteColor>()
  private _idToColor = new Map<number, RemoteColor>()

  private _toDelete : RemoteColor[] = []
  private _deleteId : ReturnType<typeof setTimeout> | undefined

  /**
   * Creates a new ColorManager instance.
   * @param rpc - The RPC client used for communication with the rendering backend
   */
  constructor (rpc: RpcSafeClient) {
    this._rpc = rpc
  }

  /**
   * Creates or retrieves a cached color instance for the given hex value.
   * @param hex - The RGBA32 color value
   * @returns Promise resolving to a ColorHandle, or undefined if creation fails
   */
  async getColor (hex: RGBA32) : Promise<RemoteColor | undefined> {
    const colors = await this.getColors([hex])
    if (!colors) return undefined
    return colors[0]
  }

  /**
   * Creates or retrieves cached color instances for multiple hex values.
   * @param c - Array of RGBA32 color values
   * @returns Promise resolving to an array of ColorHandles in the same order as input, or undefined if creation fails
   * @remarks Duplicate hex values will be mapped to the same color instance for efficiency
   */
  async getColors (c : RGBA32[]) {
    const result = new Array<RemoteColor>(c.length)
    const hexToIndices = new Map<number, number[]>()
    const toCreate: RGBA32[] = []
    for (let i = 0; i < c.length; i++) {
      const color = c[i]

      if (this._hexToColor.has(color.hex)) {
        // If the color already exists, reuse it
        result[i] = this._hexToColor.get(color.hex)!
      } else if (hexToIndices.has(color.hex)) {
        // If the color is being created, add the index to the list
        hexToIndices.get(color.hex).push(i)
      } else {
        // If the color is new, add it to the list to be created
        toCreate.push(color)
        hexToIndices.set(color.hex, [i])
      }
    }

    // Create the colors and map them to the indices
    const colors = await this._createColors(toCreate)
    if (!colors) return undefined

    for (let i = 0; i < colors.length; i++) {
      const color = toCreate[i]
      const indices = hexToIndices.get(color.hex)
      for (const index of indices) {
        result[index] = colors[i]
      }
    }

    return result
  }

  /**
   * Retrieves a color instance by its unique identifier.
   * @param id - The unique identifier of the color
   * @returns The ColorHandle associated with the ID, or undefined if not found
   */
  getFromId (id: number) {
    return this._idToColor.get(id)
  }

  /**
   * Destroys a color instance and removes it from the cache.
   * @param color - The ColorHandle to destroy
   */
  destroy (color: RemoteColor) {
    this._hexToColor.delete(color.hex)
    this._idToColor.delete(color.id)
    this._deleteColor(color)
  }

  /**
   * Destroys all color instances and clears the cache.
   */
  clear () {
    for (const color of this._idToColor.values()) {
      this.destroy(color)
    }
    this._idToColor.clear()
    this._hexToColor.clear()
  }

  /**
   * Creates multiple color instances via RPC.
   * @param colors - Array of RGBA32 color values to create
   * @returns Promise resolving to an array of ColorHandles, or undefined if creation fails
   * @private
   */
  private async _createColors (colors : RGBA32[]) : Promise<RemoteColor[] | undefined> {
    const result : RemoteColor[] = []
    if (colors.length === 0) {
      return result
    }

    const instances = await this._rpc.RPCCreateMaterialInstances(MaterialHandles.StandardOpaque, 1, colors)
    if (!instances) return undefined

    for (let i = 0; i < colors.length; i++) {
      const color = this._createColor(colors[i], instances[i])
      result.push(color)
    }
    return result
  }

  /**
   * Creates a single color instance and adds it to the cache.
   * @param color - The RGBA32 color value
   * @param id - The unique identifier for the color instance
   * @returns The created ColorHandle
   * @private
   */
  private _createColor (color: RGBA32, id: number) {
    const handle = new RemoteColor(color, id, this)
    this._hexToColor.set(color.hex, handle)
    this._idToColor.set(handle.id, handle)
    return handle
  }

  /**
   * Queues a color for deletion in the next batch.
   * @param color - The ColorHandle to delete
   * @private
   */
  private _deleteColor (color: RemoteColor) {
    // Colors are deleted in batches to reduce the number of RPC calls

    // If the batch size is reached, delete the current batch
    if (this._toDelete.length >= MAX_BATCH_SIZE) {
      this._deleteBatch()
    }

    // If there are no colors to delete, schedule a batch deletion
    if (this._toDelete.length === 0) {
      this._deleteId = setTimeout(() => {
        this._rpc.RPCDestroyMaterialInstances(this._toDelete.map(c => c.id))
        this._toDelete.length = 0
      }, 0)
    }

    this._toDelete.push(color)
  }

  /**
   * Immediately deletes all queued colors.
   * @private
   */
  private _deleteBatch () {
    this._rpc.RPCDestroyMaterialInstances(this._toDelete.map(c => c.id))
    this._toDelete.length = 0
    clearTimeout(this._deleteId)
    this._deleteId = undefined
  }
}
