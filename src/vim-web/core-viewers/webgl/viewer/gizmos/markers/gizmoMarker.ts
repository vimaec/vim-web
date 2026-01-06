import { Vim } from '../../../loader/vim'
import { Viewer } from '../../viewer'
import * as THREE from 'three'
import { SimpleInstanceSubmesh } from '../../../loader/mesh'
import { WebglAttribute } from '../../../loader/webglAttribute'
import { WebglColorAttribute } from '../../../loader/colorAttribute'
import { IVimElement } from '../../../../shared/vim'

/**
 * Marker gizmo that displays an interactive sphere at a 3D position.
 * Marker gizmos are still under development.
 */
export class Marker implements IVimElement {
  public readonly type = 'Marker'
  private _viewer: Viewer
  private _submesh: SimpleInstanceSubmesh

  private static _tmpMatrix = new THREE.Matrix4()
  private static _unitVector = new THREE.Vector3(1, 1, 1)

  /**
   * The Vim object from which this object came.
   * Can be undefined if the object is not part of a Vim.
   */
  vim: Vim | undefined

  /**
   * The BIM element index associated with this object.
   * Can be undefined if the object is not part of a Vim.
   */
  element: number | undefined

  /**
   * The geometry instances associated with this object.
   * This is used when the marker is derived from multiple instances.
   */
  instances: number[] | undefined

  /**
   * The index of the marker in the marker collection.
   */
  get index(): number {
    return this._submesh.index
  }

  get isRoom(): boolean {
    return false
  }

  private _outlineAttribute: WebglAttribute<boolean>
  private _visibleAttribute: WebglAttribute<boolean>
  private _coloredAttribute: WebglAttribute<boolean>
  private _focusedAttribute: WebglAttribute<boolean>
  private _colorAttribute: WebglColorAttribute

  /**
   * Constructs a new Marker object.
   * @param viewer - The viewer managing rendering and interaction.
   * @param submesh - The instanced submesh this marker is bound to.
   */
  constructor(viewer: Viewer, submesh: SimpleInstanceSubmesh) {
    this._viewer = viewer
    this._submesh = submesh

    const array = [submesh]
    this._outlineAttribute = new WebglAttribute(false, 'selected', 'selected', array, (v) => (v ? 1 : 0))
    this._visibleAttribute = new WebglAttribute(true, 'ignore', 'ignore', array, (v) => (v ? 0 : 1))
    this._focusedAttribute = new WebglAttribute(false, 'focused', 'focused', array, (v) => (v ? 1 : 0))
    this._coloredAttribute = new WebglAttribute(false, 'colored', 'colored', array, (v) => (v ? 1 : 0))
    this._colorAttribute = new WebglColorAttribute(array, undefined, undefined)

    this.color = new THREE.Color(0xff1a1a)
  }

  /**
   * Updates the underlying submesh and rebinds all attributes to the new mesh.
   * @param mesh - The new submesh to bind to this marker.
   */
  updateMesh(mesh: SimpleInstanceSubmesh): void {
    this._submesh = mesh
    const array = [this._submesh]
    this._visibleAttribute.updateMeshes(array)
    this._focusedAttribute.updateMeshes(array)
    this._outlineAttribute.updateMeshes(array)
    this._colorAttribute.updateMeshes(array)
    this._coloredAttribute.updateMeshes(array)
    this._viewer.renderer.needsUpdate = true
  }

  /**
   * Sets the world position of the marker.
   */
  set position(value: THREE.Vector3) {
    Marker._tmpMatrix.compose(value, new THREE.Quaternion(), new THREE.Vector3(1, 1, 1))
    this._submesh.mesh.setMatrixAt(this.index, Marker._tmpMatrix)
    this._submesh.mesh.instanceMatrix.needsUpdate = true
    this._viewer.renderer.needsUpdate = true
    this._submesh.mesh.computeBoundingSphere() // Required for raycasting
  }

  /**
   * Gets the world position of the marker.
   */
  get position(): THREE.Vector3 {
    this._submesh.mesh.getMatrixAt(this.index, Marker._tmpMatrix)
    return new THREE.Vector3().setFromMatrixPosition(Marker._tmpMatrix)
  }

  /**
   * Always false; marker is a gizmo and not an actual mesh.
   */
  get hasMesh(): boolean {
    return false
  }

  /**
   * Gets whether the marker is outlined (highlighted).
   */
  get outline(): boolean {
    return this._outlineAttribute.value
  }

  /**
   * Sets whether the marker is outlined (highlighted).
   */
  set outline(value: boolean) {
    if (this._outlineAttribute.apply(value)) {
      if (value) this._viewer.renderer.addOutline()
      else this._viewer.renderer.removeOutline()
    }
  }

  /**
   * Gets whether the marker is focused (enlarged).
   */
  get focused(): boolean {
    return this._focusedAttribute.value
  }

  /**
   * Sets whether the marker is focused (enlarged).
   */
  set focused(value: boolean) {
    this._focusedAttribute.apply(value)
    this._viewer.renderer.needsUpdate = true
  }

  /**
   * Gets whether the marker is visible in the scene.
   */
  get visible(): boolean {
    return this._visibleAttribute.value
  }

  /**
   * Sets whether the marker is visible in the scene.
   */
  set visible(value: boolean) {
    this._visibleAttribute.apply(value)
    this._viewer.renderer.needsUpdate = true
  }

  /**
   * Gets the current color override for the marker.
   */
  get color(): THREE.Color {
    return this._colorAttribute.value
  }

  /**
   * Sets the color override for the marker.
   * Passing undefined disables the override.
   */
  set color(color: THREE.Color | undefined) {
    if (color) {
      this._coloredAttribute.apply(true)
      this._colorAttribute.apply(color)
    } else {
      this._coloredAttribute.apply(false)
    }
    this._viewer.renderer.needsUpdate = true
  }

  /**
   * Gets the uniform scale factor applied to the marker.
   */
  get size(): number {
    this._submesh.mesh.getMatrixAt(this.index, Marker._tmpMatrix)
    return Marker._tmpMatrix.elements[0]
  }

  /**
   * Sets the uniform scale factor for the marker.
   * Only updates the matrix if the size has changed.
   */
  set size(value: number) {
    const matrix = Marker._tmpMatrix
    this._submesh.mesh.getMatrixAt(this.index, matrix)
    const currentSize = matrix.elements[0]
    if (currentSize !== value) {
      matrix.elements[0] = value
      matrix.elements[5] = value
      matrix.elements[10] = value
      this._submesh.mesh.setMatrixAt(this.index, matrix)
      this._submesh.mesh.instanceMatrix.needsUpdate = true
      this._viewer.renderer.needsUpdate = true
      this._submesh.mesh.computeBoundingSphere() // Required for Raycast
    }
  }

  /**
   * Retrieves the bounding box of the object.
   * Returns a unit-sized box centered at the marker position.
   * Returned as a promise to satisfy interface, but computed synchronously.
   * @returns The bounding box of the marker.
   */
  async getBoundingBox(): Promise<THREE.Box3> {
    const box = new THREE.Box3().setFromCenterAndSize(this.position.clone(), Marker._unitVector)
    return Promise.resolve(box)
  }
}
