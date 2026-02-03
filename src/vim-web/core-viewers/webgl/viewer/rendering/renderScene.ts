/**
 * @module viw-webgl-viewer/rendering
 */

import * as THREE from 'three'
import { Scene } from '../../loader/scene'
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer'
import { ModelMaterial } from '../../loader/materials/materials'
import { InstancedMesh } from '../../loader/progressive/instancedMesh'
import { MAX_VIMS } from '../../loader/vimCollection'

/**
 * Wrapper around the THREE scene that tracks bounding box and other information.
 */
export class RenderScene {
  threeScene: THREE.Scene

  // state
  boxUpdated = false

  // public value
  smallGhostThreshold: number | undefined = 10

  // Sparse storage indexed by stable vim ID for GPU picking
  private _vimScenesById: (Scene | undefined)[] = new Array(MAX_VIMS).fill(undefined)
  private _boundingBox: THREE.Box3 | undefined
  private _memory = 0
  private _2dCount = 0
  private _outlineCount = 0
  private _modelMaterial: ModelMaterial

  get meshes() {
    return this._vimScenesById
      .filter((s): s is Scene => s !== undefined)
      .flatMap((s) => s.meshes)
  }

  constructor () {
    this.threeScene = new THREE.Scene()
  }

  get estimatedMemory () {
    return this._memory
  }

  has2dObjects () {
    return this._2dCount > 0
  } 

  /** Clears the scene updated flags */
  clearUpdateFlags () {
    for (const scene of this._vimScenesById) {
      scene?.clearUpdateFlag()
    }
  }

  /**
   * Returns the bounding box encompasing all rendererd objects.
   * @param target box in which to copy result, a new instance is created if undefined.
   */
  getBoundingBox (target: THREE.Box3 = new THREE.Box3()) : THREE.Box3 | undefined {
    return this._boundingBox
      ? target.copy(this._boundingBox)
      : undefined
  }

  /**
   * Returns the bounding box of the average center of all meshes.
   * Less precise but is more stable against outliers.
   */
  getAverageBoundingBox () {
    const scenes = this._vimScenesById.filter((s): s is Scene => s !== undefined)
    if (scenes.length === 0) {
      return new THREE.Box3()
    }
    const result = new THREE.Box3()
    result.copy(scenes[0].getAverageBoundingBox())
    for (let i = 1; i < scenes.length; i++) {
      result.union(scenes[i].getAverageBoundingBox())
    }
    return result
  }

  /**
   * Add object to be rendered
   */
  add (target: Scene | THREE.Object3D) {
    if (target instanceof Scene) {
      this.addScene(target)
      target.material = this._modelMaterial
      return
    }

    this._2dCount += this.count2dObjects(target)
    this.threeScene.add(target)
  }

  private count2dObjects (target : THREE.Object3D) {
    let count =0
    target.traverse((child) => {if(child instanceof CSS2DObject) count++})
    return count
  }

  private unparent2dObjects (target : THREE.Object3D) {
    // A quirk of css2d object is they need to be removed individually.
    if (target instanceof THREE.Group) {
      for (const child of [...target.children]) {
        if (child instanceof CSS2DObject) {
          target.remove(child)
        }
      }
    }
  }

  /**
   * Remove object from rendering
   */
  remove (target: Scene | THREE.Object3D) {
    if (target instanceof Scene) {
      this.removeScene(target)
      return
    }

    this._2dCount -= this.count2dObjects(target)
    this.unparent2dObjects(target)
    this.threeScene.remove(target)
  }

  /**
   * Removes all rendered objects
   */
  clear () {
    this.threeScene.clear()
    this._vimScenesById.fill(undefined)
    this._boundingBox = undefined
    this._memory = 0
  }

  get modelMaterial() {
    return this._modelMaterial
  }
  set modelMaterial(material: ModelMaterial) {
    this._modelMaterial = material
    for (const scene of this._vimScenesById) {
      if (scene) scene.material = material
    }

    // Hide small instances when using ghost material
    this.updateInstanceMeshVisibility()
  }

  private updateInstanceMeshVisibility(){
    const hide = this._modelMaterial?.[1]?.userData.isGhost === true

    for(const mesh of this.meshes){
      if(mesh instanceof InstancedMesh){
        if(this.smallGhostThreshold <= 0){
          mesh.mesh.visible = true
          continue
        }
        // Check if any submesh is visible
        const visible = mesh.getSubmeshes().some((m) => 
          m.object.visible
        )
        mesh.mesh.visible = !(hide && !visible && mesh.size < this.smallGhostThreshold)
      }
    }
  }

  private addScene (scene: Scene) {
    // Store scene at its vim's stable ID for GPU picking
    const vimIndex = scene.vim?.vimIndex ?? 0
    this._vimScenesById[vimIndex] = scene

    scene.meshes.forEach((m) => {
      this.threeScene.add(m.mesh)
    })

    this.updateBox(scene.getBoundingBox())

    // Memory
    this._memory += scene.getMemory()
  }

  updateBox (box: THREE.Box3 | undefined) {
    if (!box) return
    this.boxUpdated = true
    this._boundingBox = this._boundingBox ? this._boundingBox.union(box) : box
  }

  private removeScene (scene: Scene) {
    // Clear the slot at this scene's vim ID
    const vimIndex = scene.vim?.vimIndex ?? 0
    this._vimScenesById[vimIndex] = undefined

    // Remove all meshes from three scene
    for (let i = 0; i < scene.meshes.length; i++) {
      this.threeScene.remove(scene.meshes[i].mesh)
    }

    // Recompute bounding box from remaining scenes
    const remainingScenes = this._vimScenesById.filter((s): s is Scene => s !== undefined)
    this._boundingBox =
      remainingScenes.length > 0
        ? remainingScenes
          .map((s) => s.getBoundingBox())
          .reduce((b1, b2) => b1.union(b2))
        : undefined
    this._memory -= scene.getMemory()
  }
}
