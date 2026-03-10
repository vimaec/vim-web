/**
 * @module vim-loader
 */

import { VimDocument } from 'vim-format'

/** Public-facing interface for BIM-to-geometry mapping. */
export interface IElementMapping {
  /** Returns element indices associated with element ID. */
  getElementsFromElementId(id: number | bigint): number[] | undefined
  /** Returns true if element exists in the vim. */
  hasElement(element: number): boolean
  /** Returns all element indices. */
  getElements(): Iterable<number>
  /** Returns instance indices for a given element. */
  getInstancesFromElement(element: number): number[] | undefined
  /** Returns the element index for a given instance. */
  getElementFromInstance(instance: number): number | undefined
  /** Returns the element ID for a given element index. */
  getElementId(element: number): bigint | undefined
}

/** @internal */
export class ElementNoMapping implements IElementMapping {
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

/** @internal */
export class ElementMapping implements IElementMapping {
  private _instanceToElement: number[] | Int32Array
  private _elementToInstances: (number[] | undefined)[]
  private _elementIds: BigInt64Array
  private _elementIdToElements: Map<bigint, number[]> | null = null

  constructor (
    instanceToElement: number[] | Int32Array,
    elementIds: BigInt64Array
  ) {
    // Direct reference - no copy needed (read-only)
    this._instanceToElement = instanceToElement

    // Build element→instances array (inverted mapping)
    this._elementToInstances = ElementMapping.invertToArray(
      instanceToElement,
      elementIds.length
    )

    this._elementIds = elementIds
  }

  static async fromG3d (bim: VimDocument) {
    const instanceToElement = await bim.node.getAllElementIndex()
    const elementIds = await bim.element.getAllId()

    return new ElementMapping(
      instanceToElement, // No conversion - use directly to avoid memory duplication
      elementIds
    )
  }

  /**
   * Returns element indices associated with element id
   * @param id element id
   */
  getElementsFromElementId (id: number | bigint) {
    if (!this._elementIdToElements) {
      this._elementIdToElements = ElementMapping.invertToMap(this._elementIds)
    }
    return this._elementIdToElements.get(BigInt(id))
  }

  /**
   * Returns true if element exists in the vim.
   */
  hasElement (element: number) {
    return element >= 0 && element < this._elementIds.length
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
    return this._elementToInstances[element] ?? []
  }

  /**
   * Returns the element index associated with the g3d instance index.
   * @param instance g3d instance index
   * @returns element index or undefined if not found
   */
  getElementFromInstance (instance: number) {
    return this._instanceToElement[instance]
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
   * Builds element→instances array by inverting the instance→element mapping
   */
  private static invertToArray (
    instanceToElement: number[] | Int32Array,
    elementCount: number
  ): (number[] | undefined)[] {
    const result: (number[] | undefined)[] = new Array(elementCount)
    for (let instance = 0; instance < instanceToElement.length; instance++) {
      const element = instanceToElement[instance]
      if (element >= 0) {
        if (!result[element]) {
          result[element] = []
        }
        result[element]!.push(instance)
      }
    }
    return result
  }

  /**
   * Returns a map where data[i] -> i
   */
  private static invertToMap (data: BigInt64Array) {
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
}
