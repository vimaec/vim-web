/**
 * @module vim-loader
 */

// External
import * as THREE from 'three'

// Vim
import { Vim, type IWebglVim } from './vim'
import { Scene } from './scene'
import { IElement, VimHelpers } from 'vim-format'
import { WebglAttribute } from './webglAttribute'
import { WebglColorAttribute } from './colorAttribute'
import { Submesh } from './mesh'
import { MappedG3d } from './progressive/mappedG3d'
import { ISelectable } from '../viewer/selection'

/**
 * Public interface for a loaded BIM element with geometry and visual state.
 *
 * Obtained via `vim.getElementFromIndex(index)` or `vim.getAllElements()`.
 *
 * @example
 * ```ts
 * const element = vim.getElementFromIndex(301)
 * element.color = new THREE.Color(0xff0000)
 * element.visible = false
 * const params = await element.getBimParameters()
 * ```
 */
export interface IElement3D extends ISelectable {
  readonly type: 'Element3D'
  /** The vim from which this element came. */
  readonly vim: IWebglVim
  /** The BIM element index. */
  readonly element: number
  /** The unique element ID. */
  readonly elementId: bigint
  /** The Revit unique ID string. */
  readonly elementUniqueId: string | undefined
  /** The geometry instances associated with this element. */
  readonly instances: number[] | undefined
  /** True if this element has geometry definitions (instances). Always available after the vim is parsed, even before geometry is loaded. */
  readonly hasGeometry: boolean
  /** True if this element has loaded mesh data. Only true after `vim.load()` has been called for a subset containing this element. */
  readonly hasMesh: boolean
  /** True if this element is a room. */
  readonly isRoom: boolean
  /** Whether to render selection outline for this element. */
  outline: boolean
  /** Whether to render focus highlight for this element. */
  focused: boolean
  /** Whether to render this element. */
  visible: boolean
  /** The display color override. Set to undefined to revert to default. */
  color: THREE.Color | undefined
  /** Retrieves BIM data for this element. */
  getBimElement(): Promise<IElement>
  /**
   * Retrieves all BIM parameters for this element.
   * @returns Array of `{ name: string, value: string, group: string }` objects.
   * Type is `VimHelpers.ElementParameter` from vim-format (accessible via `VIM.BIM.VimHelpers`).
   */
  getBimParameters(): Promise<VimHelpers.ElementParameter[]>
  /** Retrieves the bounding box in Z-up world space (X = right, Y = forward, Z = up), or undefined if the element has no geometry. */
  getBoundingBox(): Promise<THREE.Box3 | undefined>
  /** Retrieves the center position in Z-up world space, or undefined if the element has no geometry. */
  getCenter(target?: THREE.Vector3): Promise<THREE.Vector3 | undefined>
}

/**
 * High level api to interact with the loaded vim geometry and data.
 */
export class Element3D implements IElement3D {
  private _color: THREE.Color | undefined
  private _boundingBox: THREE.Box3 | undefined
  private _meshes: Submesh[] | undefined
  private readonly _g3d: MappedG3d | undefined

  private readonly _outlineAttribute: WebglAttribute<boolean>
  private readonly _visibleAttribute: WebglAttribute<boolean>
  private readonly _coloredAttribute: WebglAttribute<boolean>
  private readonly _focusedAttribute: WebglAttribute<boolean>
  private readonly _colorAttribute: WebglColorAttribute

  /**
   * Indicate whether this object is architectural or markup.
   */
  public readonly type = 'Element3D'

  /**
   * The vim object from which this object came from.
   */
  readonly vim: IWebglVim

  /** @internal */
  private get _vim (): Vim {
    return this.vim as Vim
  }

  /**
   * The bim element index associated with this object.
   */
  readonly element: number

  /**
   * The ID of the element associated with this object.
   */
  get elementId () : bigint {
    return this._vim.map.getElementId(this.element)!
  }

  /**
   * The Revit unique ID string of the element associated with this object.
   */
  get elementUniqueId () : string | undefined {
    return this._vim.map.getElementUniqueId(this.element)
  }

  /**
   * The geometry instances  associated with this object.
   */
  readonly instances: number[] | undefined

  /**
   * True if this element has geometry definitions (instances).
   * Always available after the vim is parsed, even before geometry is loaded.
   */
  get hasGeometry () {
    return (this.instances?.length ?? 0) > 0
  }

  /**
   * True if this element has loaded mesh data.
   * Only true after `vim.load()` has been called for a subset containing this element.
   */
  get hasMesh () {
    return (this._meshes?.length ?? 0) > 0
  }

  get isRoom(){
    const instance = this.instances[0] ?? -1
    return this._g3d?.getInstanceHasFlag(instance, 1) ?? false
  }

  /**
   * Determines whether to render selection outline for this object or not.
   */
  get outline () {
    return this._outlineAttribute.value
  }

  set outline (value: boolean) {
    if (this._outlineAttribute.apply(value)) {
      this.renderer.notifySceneUpdate()
      if (value) this.renderer.addOutline()
      else this.renderer.removeOutline()
    }
  }

  /**
   * Determines whether to render focus highlight for this object or not.
   */
  get focused () {
    return this._focusedAttribute.value
  }

  set focused (value: boolean) {
    if (this._focusedAttribute.apply(value)) {
      this.renderer.notifySceneUpdate()
    }
  }

  /**
   * Determines whether to render this object or not.
   */
  get visible () {
    return this._visibleAttribute.value
  }

  set visible (value: boolean) {
    if (this._visibleAttribute.apply(value)) {
      this.renderer.notifySceneUpdate()

      // Show all involved meshes
      if(value){
        this._meshes?.forEach((m) => {
          m.mesh.mesh.visible = true
        })
      }
    }
  }

  /**
   * Gets or sets the display color of this object.
   * @param {THREE.Color | undefined} color The color to apply. Pass undefined to revert to the default color.
   * @returns {THREE.Color} The current color of the object.
   */
  get color () {
    return this._color
  }

  set color (color: THREE.Color | undefined) {
    this._color = color
    this._coloredAttribute.apply(this._color !== undefined)
    this._colorAttribute.apply(this._color)
    this.renderer.notifySceneUpdate()
  }

  private get renderer(){
    return (this._vim.scene as Scene).renderer
  }

  /**
   * @internal
   */
  constructor (
    vim: Vim,
    element: number,
    instances: number[] | undefined,
    meshes: Submesh[] | undefined,
    g3d: MappedG3d | undefined
  ) {
    this.vim = vim
    this.element = element
    this.instances = instances
    this._meshes = meshes
    this._g3d = g3d

    this._outlineAttribute = new WebglAttribute(
      false,
      'selected',
      'selected',
      meshes,
      (v) => (v ? 1 : 0)
    )

    this._visibleAttribute = new WebglAttribute(
      true,
      'ignore',
      'ignore',
      meshes,
      (v) => (v ? 0 : 1)
    )

    this._focusedAttribute = new WebglAttribute(
      false,
      'focused',
      'focused',
      meshes,
      (v) => (v ? 1 : 0)
    )

    this._coloredAttribute = new WebglAttribute(
      false,
      'colored',
      'colored',
      meshes,
      (v) => (v ? 1 : 0)
    )

    this._colorAttribute = new WebglColorAttribute(meshes, undefined)
  }

  /**
   * Asynchronously retrieves Bim data for the element associated with this object.
   * @returns {IElement} An object containing the bim data for this element.
   */
  async getBimElement (): Promise<IElement> {
    return this._vim.bim.element.get(this.element)
  }

  /**
   * Asynchronously retrieves Bim parameters for the element associated with this object.
   * @returns {VimHelpers.ElementParameter[]} An array of all bim parameters for this elements.
   */
  async getBimParameters (): Promise<VimHelpers.ElementParameter[]> {
    return VimHelpers.getElementParameters(this._vim.bim, this.element)
  }

  /**
   * Retrieves the bounding box of the object from cache or computes it if needed.
   * Returns undefined if the element is abstract.
   * @returns {THREE.Box3 | undefined} The bounding box of the object, or undefined if the object has no geometry.
   */
  async getBoundingBox () {
    if (!this.instances || !this._meshes) return
    if (this._boundingBox) return this._boundingBox

    let box: THREE.Box3 | undefined
    this._meshes.forEach((m) => {
      const sub = m
      const b = sub.boundingBox
      box = box ? box.union(b) : b.clone()
    })
    if (box) {
      box.applyMatrix4(this.vim.scene.matrix)
      this._boundingBox = box
    }

    return Promise.resolve(this._boundingBox)
  }

  /**
   * Retrieves the center position of this object.
   * @param {THREE.Vector3} [target=new THREE.Vector3()] Optional parameter specifying where to copy the center position data.
   * A new instance is created if none is provided.
   * @returns {THREE.Vector3 | undefined} The center position of the object, or undefined if the object has no geometry.
   */
  public async getCenter (target: THREE.Vector3 = new THREE.Vector3()) {
    const box = await this.getBoundingBox()
    return box?.getCenter(target)
  }

  /**
   * @internal
   * Replaces this object's meshes and apply color as needed.
   * @param {Submesh} mesh The new mesh to be added.
   * @throws {Error} Throws an error if the provided mesh instance does not match any existing instances.
   */
  addMesh (mesh: Submesh) {
    if (this.instances.findIndex((i) => i === mesh.instance) < 0) {
      throw new Error('Cannot update mismatched instance')
    }

    if (this._meshes) {
      if (this._meshes.findIndex((m) => m.equals(mesh)) < 0) {
        this._meshes.push(mesh)
        this.updateMeshes(this._meshes)
      }
    } else {
      this._meshes = [mesh]
      this.updateMeshes(this._meshes)
    }
  }

  private updateMeshes (meshes: Submesh[] | undefined) {
    this._meshes = meshes
    this.renderer.requestRender()

    this._outlineAttribute.updateMeshes(meshes)
    this._visibleAttribute.updateMeshes(meshes)
    this._focusedAttribute.updateMeshes(meshes)
    this._coloredAttribute.updateMeshes(meshes)
    this._colorAttribute.updateMeshes(meshes)
  }
}
