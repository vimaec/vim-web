/**
 * @module viw-webgl-viewer/gizmos/sectionBox
 */

import * as THREE from 'three'
import { SectionBoxHandle } from './sectionBoxHandle'

export class SectionBoxHandles {
  readonly up: SectionBoxHandle
  readonly down: SectionBoxHandle
  readonly left: SectionBoxHandle
  readonly right: SectionBoxHandle
  readonly front: SectionBoxHandle
  readonly back: SectionBoxHandle

  readonly meshes : THREE.Group

  constructor(){
    const size = 2
    this.up = new SectionBoxHandle('y', 1, size, new THREE.Color(0x00ff00))
    this.down = new SectionBoxHandle('y', -1, size, new THREE.Color(0x00ff00))
    this.left = new SectionBoxHandle('x', -1, size, new THREE.Color(0xff0000))
    this.right = new SectionBoxHandle('x', 1, size, new THREE.Color(0xff0000))
    this.front = new SectionBoxHandle('z', 1, size, new THREE.Color(0x0000ff))
    this.back = new SectionBoxHandle('z', -1, size, new THREE.Color(0x0000ff))

    this.meshes = new THREE.Group()
    this.meshes.add(this.up)
    this.meshes.add(this.down)
    this.meshes.add(this.left)
    this.meshes.add(this.right)
    this.meshes.add(this.front)
    this.meshes.add(this.back)
  }

  get visible(){
    return this.meshes.visible
  }

  set visible(value: boolean){
    this.meshes.visible = value
  }

  fitBox(box: THREE.Box3){
    const center = box.getCenter(new THREE.Vector3())
    this.up.setPosition(new THREE.Vector3(center.x, box.max.y, center.z))
    this.down.setPosition(new THREE.Vector3(center.x, box.min.y, center.z))
    this.left.setPosition(new THREE.Vector3(box.min.x, center.y, center.z))
    this.right.setPosition(new THREE.Vector3(box.max.x, center.y, center.z))
    this.front.setPosition(new THREE.Vector3(center.x, center.y, box.max.z))
    this.back.setPosition(new THREE.Vector3(center.x, center.y, box.min.z))
  }

  dispose(){
    this.up.dispose()
    this.down.dispose()
    this.left.dispose()
    this.right.dispose()
    this.front.dispose()
    this.back.dispose()
  }
}


