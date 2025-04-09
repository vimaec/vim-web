import { THREE } from "../.."

export interface IVimObject{
  vim: IVim<IVimObject>
  getBoundingBox(): Promise<THREE.Box3>
}

export interface IVim<T extends IVimObject> {
    /**
     * Retrieves the object associated with the specified instance number.
     * @param instance - The instance number of the object.
     * @returns The object corresponding to the instance, or undefined if not found.
     */
    getObjectFromInstance(instance: number): T | undefined
  
    /**
     * Retrieves the objects associated with the specified element ID.
     * @param id - The element ID to retrieve objects for.
     * @returns An array of objects corresponding to the element ID.
     */
    getObjectsFromElementId(id: number): T[]
  
    /**
     * Retrieves the Vim object associated with the given Vim element index.
     * @param element - The index of the Vim element.
     * @returns The Vim object corresponding to the element index, or undefined if not found.
     */
    getObjectFromElementIndex(element: number): T | undefined
  
    /**
     * Retrieves all objects within the Vim.
     * @returns An array of all Vim objects.
     */
    getAllObjects(): T[]

    /**
     * Retrieves the bounding box of the Vim object.
     * @returns The bounding box of the Vim object.
     */
    getBoundingBox(): Promise<THREE.Box3>
  
}