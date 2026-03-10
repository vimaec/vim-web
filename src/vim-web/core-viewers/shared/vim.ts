import * as THREE from 'three'

/**
 * Interface for a Vim element.
 */
export interface IVimElement{

  /**
   * The vim from which this object came.
   */
  vim: IVim<IVimElement> | undefined

  /**
   * The bounding box of the object.
   */
  getBoundingBox(): Promise<THREE.Box3 | undefined>
}

/**
 * Interface for a Vim object.
 * @template T - The type of element contained in the Vim.
 */
export interface IVim<T extends IVimElement> {
    /**
     * Stable index assigned by the viewer (0-254).
     * Used by VimCollection for O(1) lookup.
     */
    readonly vimIndex: number

    /**
     * Retrieves the element associated with the specified instance index.
     * @param instance - The instance index of the of one of the instance included in the element.
     * @returns The object corresponding to the instance, or undefined if not found.
     */
    getElement(instance: number): T | undefined

    /**
     * Retrieves the element associated with the specified id.
     * @param id - The element ID to retrieve objects for (number or bigint).
     * @returns An array of element corresponding to the given id.
     */
    getElementsFromId(id: number | bigint): T[]

    /**
     * Retrieves the element associated with the given index.
     * @param element - The index of the element.
     * @returns The element corresponding to the element index, or undefined if not found.
     */
    getElementFromIndex(element: number): T | undefined

    /**
     * Retrieves all elements within the Vim.
     * @returns An array of all Vim objects.
     */
    getAllElements(): T[]
}