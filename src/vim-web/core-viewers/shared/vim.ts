import { THREE } from "../.."

export interface IVimElement{
  vim: IVim<IVimElement>
  getBoundingBox(): Promise<THREE.Box3>
}

export interface IVim<T extends IVimElement> {
    /**
     * Retrieves the element associated with the specified instance index.
     * @param instance - The instance index of the of one of the instance included in the element.
     * @returns The object corresponding to the instance, or undefined if not found.
     */
    getElementFromInstanceIndex(instance: number): T | undefined
  
    /**
     * Retrieves the element associated with the specified id.
     * @param id - The element ID to retrieve objects for.
     * @returns An array of element corresponding to the given id.
     */
    getElementFromId(id: number): T[]
  
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

    /**
     * Retrieves the bounding box of the Vim object.
     * @returns The bounding box of the Vim object.
     */
    getBoundingBox(): Promise<THREE.Box3>
  
}