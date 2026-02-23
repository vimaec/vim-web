/**
 * @module vim-loader
 */

import * as THREE from 'three'
import { VimDocument, VimHeader } from 'vim-format'
import { Scene, IScene } from './scene'
import { VimSettings } from './vimSettings'
import { Element3D, type IElement3D } from './element3d'
import {
  IElementMapping,
  ElementMapping,
  ElementNoMapping
} from './elementMapping'
import { G3dSubset, ISubset } from './progressive/g3dSubset'
import { VimMeshFactory } from './progressive/vimMeshFactory'
import { IVim } from '../../shared/vim'
import { MappedG3d } from './progressive/mappedG3d'

/**
 * Public API for a loaded VIM model, accessed via `viewer.vims`.
 *
 * Provides element queries, BIM data access, scene/material control,
 * and progressive geometry loading.
 *
 * @example
 * ```ts
 * const vim = await viewer.load({ url }).getVim()
 *
 * // Query elements
 * const element = vim.getElementFromIndex(301)
 * const all = vim.getAllElements()
 *
 * // BIM data
 * const doc = vim.bim
 *
 * // Progressive loading
 * const sub = vim.subset().filter('instance', indices)
 * await vim.load(sub)
 * ```
 */
export interface IWebglVim extends IVim<IElement3D> {
  readonly type: 'webgl'
  /** The URL this vim was loaded from, if applicable. */
  readonly source: string | undefined
  /** The VIM file header. */
  readonly header: VimHeader | undefined
  /** BIM document for querying element properties, categories, levels, etc. */
  readonly bim: VimDocument | undefined
  /** The scene containing this vim's geometry. */
  readonly scene: IScene
  /** The bounding box of all loaded geometry, or undefined if nothing loaded. */
  getBoundingBox(): Promise<THREE.Box3 | undefined>
  /** Returns a subset representing all instances, for use with {@link load} and filtering. */
  subset(): ISubset
  /**
   * Loads geometry for the given subset, or all geometry if no subset is provided.
   * @param subset - The subset to load. Omit to load everything.
   */
  load(subset?: ISubset): Promise<void>
  /** Removes all loaded geometry from the renderer. */
  clear(): void
}

/** @internal */
export class Vim implements IWebglVim {
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

  private readonly _g3d: MappedG3d | undefined

  /**
   * The settings used when this vim was opened.
   */
  readonly settings: VimSettings

  private readonly _scene: Scene

  /**
   * The scene in which the vim geometry is added.
   */
  get scene (): IScene { return this._scene }

  /** @internal */
  readonly map: IElementMapping

  private readonly _factory: VimMeshFactory
  private readonly _elementToObject = new Map<number, Element3D>()

  constructor (
    header: VimHeader | undefined,
    document: VimDocument,
    g3d: MappedG3d | undefined,
    scene: Scene,
    settings: VimSettings,
    vimIndex: number,
    map: ElementMapping | ElementNoMapping,
    factory: VimMeshFactory,
    source: string) {
    this.header = header
    this.bim = document
    this._g3d = g3d
    scene.vim = this
    this._scene = scene
    this.settings = settings
    this.vimIndex = vimIndex

    this.map = map ?? new ElementNoMapping()
    this._factory = factory
    this.source = source
  }

  getBoundingBox(): Promise<THREE.Box3 | undefined> {
    const box = this._scene.getBoundingBox()
    return Promise.resolve(box)
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
    const meshes = this._scene.getMeshesFromInstances(instances)

    const result = new Element3D(this, element, instances, meshes, this._g3d)
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
   * Retrieves all instances as a subset.
   * @returns {ISubset} A subset containing all instances.
   */
  subset (): ISubset {
    return new G3dSubset(this._factory.g3d)
  }

  /**
   * Loads geometry for the given subset, or all geometry if no subset is provided.
   * Caller is responsible for not loading the same subset twice.
   * @param subset - The subset to load. Omit to load everything.
   */
  async load (subset?: ISubset) {
    subset ??= this.subset()
    if (subset.getInstanceCount() === 0) return
    this._factory.add(subset as G3dSubset)
  }

  /**
   * Removes the current geometry from the renderer.
   */
  clear () {
    this._elementToObject.clear()
    this._scene.clear()
  }

  /** @internal Called by Viewer.remove() — do not call directly. */
  dispose () {
    this._scene.dispose()
  }
}
