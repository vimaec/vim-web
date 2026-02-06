/**
 * @module vim-loader
 */

import * as THREE from 'three'
import { InsertableSubmesh } from './progressive/insertableSubmesh'
import { InstancedSubmesh } from './progressive/instancedSubmesh'

export type MergedSubmesh = InsertableSubmesh
export type Submesh = MergedSubmesh | InstancedSubmesh

export class SimpleInstanceSubmesh {
  mesh: THREE.InstancedMesh
  get three () { return this.mesh }
  index : number
  readonly merged = false

  constructor (mesh: THREE.InstancedMesh, index : number) {
    this.mesh = mesh
    this.index = index
  }
}
