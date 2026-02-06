/**
 * @module vim-loader
 */

import * as THREE from 'three'
import { VimDocument, G3d, VimHeader, FilterMode } from 'vim-format'
import { Scene } from './scene'
import { VimSettings } from './vimSettings'
import { Element3D } from './element3d'
import {
  ElementMapping,
  ElementNoMapping
} from './elementMapping'
import { ISignal, SignalDispatcher } from 'ste-signals'
import { G3dSubset } from './progressive/g3dSubset'
import { VimMeshFactory } from './progressive/vimMeshFactory'
import { IVim } from '../../shared/vim'

/**
 * Represents a container for the built three.js meshes and the vim data from which they were constructed.
 * Facilitates high-level scene manipulation by providing access to objects.
 */
export class Vim implements IVim<Element3D> {
  /**
   * The type of the viewer, indicating it is a WebGL viewer.
   * Useful for distinguishing between different viewer types in a multi-viewer application.
   */
  readonly type = 'webgl';

  /**
   * The stable ID of this vim in the scene's vim collection (0-255).
   * Used for GPU picking to identify which vim an element belongs to.
   */
  readonly vimIndex: number

  /**
   * Indicates the url this vim came from if applicable.
   */
  readonly source: string | undefined

  /**
   * The header for this vim.
   */
  readonly header: VimHeader | undefined

  /**
   * The interface to access bim data related to this vim if available.
   */
  readonly bim: VimDocument | undefined

  /**
   * The raw g3d geometry scene definition.
   */
  readonly g3d: G3d | undefined

  /**
   * The settings used when this vim was opened.
   */
  readonly settings: VimSettings

  /**
   * Mostly Internal - The scene in which the vim geometry is added.
   */
  readonly scene: Scene

  /**
   * The mapping from Bim to Geometry for this vim.
   */
  readonly map: ElementMapping | ElementNoMapping

  private readonly _factory: VimMeshFactory
  private readonly _loadedInstances = new Set<number>()
  private readonly _elementToObject = new Map<number, Element3D>()
  private _onUpdate = new SignalDispatcher()

  /**
   * Getter for accessing the event dispatched whenever a subset begins or finishes loading.
   * @returns {ISignal} The event dispatcher for loading updates.
   */
  get onLoadingUpdate (): ISignal {
    return this._onUpdate.asEvent()
  }

  /**
   * Getter for accessing the signal dispatched when the object is disposed.
   * @returns {ISignal} The signal for disposal events.
   */
  get onDispose () {
    return this._onDispose as ISignal
  }

  private _onDispose = new SignalDispatcher()

  constructor (
    header: VimHeader | undefined,
    document: VimDocument,
    g3d: G3d | undefined,
    scene: Scene,
    settings: VimSettings,
    vimIndex: number,
    map: ElementMapping | ElementNoMapping,
    factory: VimMeshFactory,
    source: string) {
    this.header = header
    this.bim = document
    this.g3d = g3d
    scene.vim = this
    this.scene = scene
    this.settings = settings
    this.vimIndex = vimIndex

    this.map = map ?? new ElementNoMapping()
    this._factory = factory
    this.source = source
  }

  getBoundingBox(): Promise<THREE.Box3> {
    const box = this.scene.getBoundingBox()
    return Promise.resolve(box)
  }

  /**
   * Retrieves the matrix representation of the Vim object's position, rotation, and scale.
   * @returns {THREE.Matrix4} The matrix representing the Vim object's transformation.
   */
  getMatrix () {
    return this.settings.matrix
  }

  /**
   * Retrieves the object associated with the specified instance number.
   * @param {number} instance - The instance number of the object.
   * @returns {THREE.Object3D | undefined} The object corresponding to the instance, or undefined if not found.
   */
  getElement (instance: number) {
    const element = this.map.getElementFromInstance(instance)
    if (element === undefined) return
    return this.getElementFromIndex(element)
  }

  /**
   * Retrieves the objects associated with the specified element ID.
   * @param {number} id - The element ID to retrieve objects for.
   * @returns {THREE.Object3D[]} An array of objects corresponding to the element ID, or an empty array if none are found.
   */
  getElementsFromId (id: number) {
    const elements = this.map.getElementsFromElementId(id)
    return elements
      ?.map((e) => this.getElementFromIndex(e))
      .filter((o): o is Element3D => o !== undefined) ?? []
  }

  /**
   * Retrieves the Vim object associated with the given Vim element index.
   * @param {number} element - The index of the Vim element.
   * @returns {WebglElement3D | undefined} The Vim object corresponding to the element index, or undefined if not found.
   */
  getElementFromIndex (element: number): Element3D | undefined {
    if (!this.map.hasElement(element)) return

    if (this._elementToObject.has(element)) {
      return this._elementToObject.get(element)
    }

    const instances = this.map.getInstancesFromElement(element)
    const meshes = this.scene.getMeshesFromInstances(instances)

    const result = new Element3D(this, element, instances, meshes)
    this._elementToObject.set(element, result)
    return result
  }

  /**
   * Retrieves an array of all objects within the Vim.
   * @returns {WebglElement3D[]} An array containing all objects within the Vim.
   */
  getAllElements () {
    const result : Element3D[] = []
    for (const e of this.map.getElements()) {
      const obj = this.getElementFromIndex(e)
      result.push(obj)
    }
    return result
  }

  /**
   * Retrieves an array containing all objects within the specified subset.
   * @param {G3dSubset} subset - The subset to retrieve objects from.
   * @returns {WebglElement3D[]} An array of objects within the specified subset.
   */
  getObjectsInSubset (subset: G3dSubset) {
    const set = new Set<Element3D>()
    const result: Element3D[] = []
    const count = subset.getInstanceCount()
    for (let i = 0; i < count; i++) {
      const instance = subset.getVimInstance(i)
      const obj = this.getElement(instance)
      if (!set.has(obj)) {
        result.push(obj)
        set.add(obj)
      }
    }
    return result
  }

  /**
   * Retrieves all instances as a subset.
   * @returns {G3dSubset} A subset containing all instances.
   */
  getFullSet (): G3dSubset {
    return new G3dSubset(this._factory.g3d)
  }

  /**
   * Asynchronously loads all geometry.
   */
  async loadAll () {
    return this.loadSubset(this.getFullSet())
  }

  /**
   * Asynchronously loads geometry for the specified subset.
   * @param {G3dSubset} subset - The subset to load resources for.
   */
  async loadSubset (subset: G3dSubset) {
    subset = subset.except('instance', this._loadedInstances)
    const count = subset.getInstanceCount()
    for (let i = 0; i < count; i++) {
      this._loadedInstances.add(subset.getVimInstance(i))
    }

    if (subset.getInstanceCount() === 0) {
      console.log('Empty subset. Ignoring')
      return
    }
    this._factory.add(subset)
    this._onUpdate.dispatch()
  }

  /**
   * Asynchronously loads geometry based on a specified filter mode and criteria.
   * @param {FilterMode} filterMode - The mode of filtering to apply.
   * @param {number[]} filter - The filter criteria.
   */
  async loadFilter (
    filterMode: FilterMode,
    filter: number[]
  ) {
    const subset = this.getFullSet().filter(filterMode, filter)
    await this.loadSubset(subset)
  }

  /**
   * Removes the current geometry from the renderer.
   */
  clear () {
    this._elementToObject.clear()
    this._loadedInstances.clear()
    this.scene.clear()
    this._onUpdate.dispatch()
  }

  /**
   * Cleans up and releases resources associated with the vim.
   */
  dispose () {
    this._onDispose.dispatch()
    this._onDispose.clear()
    this.scene.dispose()
  }
}
