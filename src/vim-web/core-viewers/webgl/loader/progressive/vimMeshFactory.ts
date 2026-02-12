/**
 * @module vim-loader
 */

/**
 * Orchestrator that routes G3dSubset instances to the appropriate mesh factory:
 * - Meshes with <=5 instances → InsertableMeshFactory (merged, geometry duplicated per instance)
 * - Meshes with >5 instances → InstancedMeshFactory (GPU instanced, geometry shared)
 *
 * Merged meshes are chunked at 16M indices (GPU picking allows larger chunks without raycast penalty).
 */

import { Scene } from '../scene'
import { G3dMaterial } from 'vim-format'
import { InsertableMeshFactory } from './insertableMeshFactory'
import { InstancedMeshFactory } from './instancedMeshFactory'
import { G3dSubset } from './g3dSubset'
import { ElementMapping } from '../elementMapping'
import { MappedG3d } from './mappedG3d'

export class VimMeshFactory {
  readonly g3d: MappedG3d
  private _insertableFactory: InsertableMeshFactory
  private _instancedFactory: InstancedMeshFactory
  private _scene: Scene

  constructor (g3d: MappedG3d, materials: G3dMaterial, scene: Scene, mapping: ElementMapping, vimIndex: number = 0) {
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
    // Split in single pass instead of two filterByCount calls
    const [merged, instanced] = subset.splitByCount(5)

    // Instanced meshes first (one Three.js InstancedMesh per unique geometry)
    this.addInstancedMeshes(this._scene, instanced)
    // Merged meshes chunked at 16M indices (GPU picking removes raycast traversal constraint)
    const chunks = merged.chunks(16_000_000)
    for(const chunk of chunks) {
      this.addMergedMesh(this._scene, chunk)
    }
  }

  private addMergedMesh (scene: Scene, subset: G3dSubset) {
    const opaque = this._insertableFactory.createOpaqueFromVim(this.g3d, subset)
    if (opaque) scene.addMesh(opaque)

    const transparent = this._insertableFactory.createTransparentFromVim(this.g3d, subset)
    if (transparent) scene.addMesh(transparent)
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
      if (opaque) scene.addMesh(opaque)

      const transparent = this._instancedFactory.createTransparentFromVim(
        this.g3d,
        mesh,
        instances
      )
      if (transparent) scene.addMesh(transparent)
    }
  }
}
