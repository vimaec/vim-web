/**
 * @module vim-loader
 */

import { VimDocument } from 'vim-format'
import { MappedG3d } from './progressive/mappedG3d'

export class ElementNoMapping {
  getElementsFromElementId (id: number) {
    return undefined
  }

  hasElement (element: number) {
    return false
  }

  getElements () {
    return []
  }

  getInstancesFromElement (element: number): number[] | undefined {
    return undefined
  }

  getElementFromInstance (instance: number) {
    return undefined
  }

  getElementId (element: number) : bigint | undefined {
    return undefined
  }
}

export class ElementMapping {
  private _instanceToElement: Map<number, number>
  private _instanceMeshes: Int32Array
  private _elementToInstances: Map<number, number[]>
  private _elementIds: BigInt64Array
  private _elementIdToElements: Map<bigint, number[]>

  constructor (
    instances: number[],
    instanceToElement: number[],
    elementIds: BigInt64Array,
    instanceMeshes?: Int32Array
  ) {
    this._instanceToElement = new Map<number, number>()
    instances.forEach((i) =>
      this._instanceToElement.set(i, instanceToElement[i])
    )
    this._elementToInstances = ElementMapping.invertMap(
      this._instanceToElement
    )
    this._elementIds = elementIds
    this._elementIdToElements = ElementMapping.invertArray(elementIds)
    this._instanceMeshes = instanceMeshes
  }

  static async fromG3d (g3d: MappedG3d, bim: VimDocument) {
    const instanceToElement = await bim.node.getAllElementIndex()
    const elementIds = await bim.element.getAllId()

    return new ElementMapping(
      Array.from(g3d.instanceNodes),
      instanceToElement,
      elementIds,
      g3d.instanceMeshes
    )
  }

  /**
   * Returns element indices associated with element id
   * @param id element id
   */
  getElementsFromElementId (id: number | bigint) {
    return this._elementIdToElements.get(BigInt(id))
  }

  /**
   * Returns true if element exists in the vim.
   */
  hasElement (element: number) {
    return element >= 0 && element < this._elementIds.length
  }

  hasMesh (element: number) {
    if (!this._instanceMeshes) return true
    const instances = this._elementToInstances.get(element)
    for (const i of instances) {
      if (this._instanceMeshes[i] >= 0) {
        return true
      }
    }
    return false
  }

  /**
   * Returns all element indices of the vim
   */
  getElements () {
    return this._elementIds.keys()
  }

  /**
   * Returns instance indices associated with vim element index
   * @param element vim element index
   */
  getInstancesFromElement (element: number): number[] | undefined {
    if (!this.hasElement(element)) return
    return this._elementToInstances.get(element) ?? []
  }

  /**
   * Returns the element index associated with the g3d instance index.
   * @param instance g3d instance index
   * @returns element index or undefined if not found
   */
  getElementFromInstance (instance: number) {
    return this._instanceToElement.get(instance)
  }

  /**
   * Retrieves the element ID corresponding to the provided element index.
   * @param {number} element The element index.
   * @returns {bigint} The element ID associated with the given index.
   */
  getElementId (element: number) {
    return this._elementIds[element]
  }

  /**
   * Returns a map where data[i] -> i
   */
  private static invertArray (data: BigInt64Array) {
    const result = new Map<bigint, number[]>()
    for (let i = 0; i < data.length; i++) {
      const value = data[i]
      const list = result.get(value)
      if (list) {
        list.push(i)
      } else {
        result.set(value, [i])
      }
    }
    return result
  }

  /**
   * Returns a map where data[i] -> i
   */
  private static invertMap (data: Map<number, number>) {
    const result = new Map<number, number[]>()
    for (const [key, value] of data.entries()) {
      const list = result.get(value)
      if (list) {
        list.push(key)
      } else {
        result.set(value, [key])
      }
    }
    return result
  }
}
