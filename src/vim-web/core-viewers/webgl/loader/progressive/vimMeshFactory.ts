/**
 * @module vim-loader
 */

/**
 * Orchestrator that routes G3dSubset instances to the appropriate mesh factory:
 * - Meshes with <=5 instances → InsertableMeshFactory (merged, geometry duplicated per instance)
 * - Meshes with >5 instances → InstancedMeshFactory (GPU instanced, geometry shared)
 *
 * Merged meshes are further chunked at 4M indices to keep buffer sizes manageable.
 */

import { Scene } from '../scene'
import { G3dMaterial, G3d } from 'vim-format'
import { InsertableMeshFactory } from './insertableMeshFactory'
import { InstancedMeshFactory } from './instancedMeshFactory'
import { G3dSubset } from './g3dSubset'
import { ElementMapping } from '../elementMapping'

export class VimMeshFactory {
  readonly g3d: G3d
  private _insertableFactory: InsertableMeshFactory
  private _instancedFactory: InstancedMeshFactory
  private _scene: Scene

  constructor (g3d: G3d, materials: G3dMaterial, scene: Scene, mapping: ElementMapping, vimIndex: number = 0) {
    this.g3d = g3d
    this._scene = scene
    this._insertableFactory = new InsertableMeshFactory(materials, mapping, vimIndex)
    this._instancedFactory = new InstancedMeshFactory(mapping, vimIndex)
  }

  /**
   * Adds all instances from subset to the scene.
   * Decision logic:
   * - <=5 instances per mesh → merged (geometry duplicated, chunked at 4M indices)
   * - >5 instances per mesh → GPU instanced (geometry shared, one mesh per unique geometry)
   */
  public add (subset: G3dSubset) {
    const uniques = subset.filterByCount((count) => count <= 5)
    const nonUniques = subset.filterByCount((count) => count > 5)

    // Instanced meshes first (one Three.js InstancedMesh per unique geometry)
    this.addInstancedMeshes(this._scene, nonUniques)
    // Merged meshes chunked at 4M indices to keep buffer sizes manageable
    const chunks = uniques.chunks(4_000_000)
    for(const chunk of chunks) {
      this.addMergedMesh(this._scene, chunk)
    }
  }

  private addMergedMesh (scene: Scene, subset: G3dSubset) {
    scene.addMesh(this._insertableFactory.createOpaqueFromVim(this.g3d, subset))
    scene.addMesh(this._insertableFactory.createTransparentFromVim(this.g3d, subset))
  }

  private addInstancedMeshes (scene: Scene, subset: G3dSubset) {
    const count = subset.getMeshCount()
    for (let m = 0; m < count; m++) {
      const mesh = subset.getSourceMesh(m)
      const instances =
        subset.getMeshInstances(m) ?? this.g3d.meshInstances[mesh]

      const opaque = this._instancedFactory.createOpaqueFromVim(
        this.g3d,
        mesh,
        instances
      )
      const transparent = this._instancedFactory.createTransparentFromVim(
        this.g3d,
        mesh,
        instances
      )
      scene.addMesh(opaque)
      scene.addMesh(transparent)
    }
  }
}
