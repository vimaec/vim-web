/**
 * @module viw-webgl-viewer/gizmos/sectionBox
 */

import * as THREE from 'three'

export class Handle extends THREE.Mesh {
  private _color : THREE.Color
  private _highlightColor : THREE.Color
  private _forward : THREE.Vector3
  private HEIGHT = 3

  constructor(forward : THREE.Vector3, height: number, color?: THREE.Color){
    
    const geo = new THREE.ConeGeometry(1, height, 12)
    geo.clearGroups()
    geo.addGroup(0, Infinity, 0)
    geo.addGroup(0, Infinity, 1)
    

    const matBehind = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.5,
      color: color ?? new THREE.Color(0x000000),
      depthTest: false,
      side: THREE.FrontSide
    })
    const matAlways = new THREE.MeshBasicMaterial({
      color: color ?? new THREE.Color(0x000000),
      side: THREE.FrontSide
    })
    super(geo, [matAlways, matBehind])
    this._forward = forward
    this._color = color ?? new THREE.Color(0x000000)
    this._highlightColor =  this._color.clone().lerp(new THREE.Color(0xffffff), 0.90)
    this.userData.handle = this
    this.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), forward)
  }

  setPosition(position : THREE.Vector3){
    this.position.copy(position).add(this._forward.clone().multiplyScalar(this.HEIGHT/2))
  }

  get forward(){
    return this._forward
  }

  highlight(value: boolean){
    console.log('highlight', value)
    this.material[0].color.set(value ? this._highlightColor : this._color)
    this.material[1].color.set(value ? this._highlightColor : this._color)
  }
}

export class Handles{
  readonly up: Handle
  readonly down: Handle
  readonly left: Handle
  readonly right: Handle
  readonly front: Handle
  readonly back: Handle

  readonly meshes : THREE.Group

  constructor(){
    this.up = new Handle(new THREE.Vector3(0, 1, 0), 3, new THREE.Color(0x00ff00))
    this.down = new Handle(new THREE.Vector3(0, -1, 0), 3, new THREE.Color(0x00ff00))
    this.left = new Handle(new THREE.Vector3(-1, 0, 0), 3, new THREE.Color(0xff0000))
    this.right = new Handle(new THREE.Vector3(1, 0, 0), 3, new THREE.Color(0xff0000))
    this.front = new Handle(new THREE.Vector3(0, 0, 1), 3, new THREE.Color(0x0000ff))
    this.back = new Handle(new THREE.Vector3(0, 0, -1), 3, new THREE.Color(0x0000ff))

    this.meshes = new THREE.Group()
    this.meshes.add(this.up)
    this.meshes.add(this.down)
    this.meshes.add(this.left)
    this.meshes.add(this.right)
    this.meshes.add(this.front)
    this.meshes.add(this.back)
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
}

/**
 * Defines the thin outline on the edges of the section box.
 */
export class BoxOutline extends THREE.LineSegments {
  constructor () {
    // prettier-ignore
    const vertices = new Float32Array([
      -0.5, -0.5, -0.5,
      0.5, -0.5, -0.5,
      0.5, 0.5, -0.5,
      -0.5, 0.5, -0.5,
      -0.5, -0.5, 0.5,
      0.5, -0.5, 0.5,
      0.5, 0.5, 0.5,
      -0.5, 0.5, 0.5
    ])
    // prettier-ignore
    const indices = [

      0.5, 1,
      1, 2,
      2, 3,
      3, 0,

      4, 5,
      5, 6,
      6, 7,
      7, 4,

      0, 4,
      1, 5,
      2, 6,
      3, 7
    ]
    const geo = new THREE.BufferGeometry()
    const mat = new THREE.LineBasicMaterial({
      opacity: 1,
      color: new THREE.Color(0x000000)
    })
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
    geo.setIndex(indices)
    super(geo, mat)
  }

  /**
   * Resize the outline to the given box.
   */
  fitBox (box: THREE.Box3) {
    this.scale.set(
      box.max.x - box.min.x,
      box.max.y - box.min.y,
      box.max.z - box.min.z
    )
    this.position.set(
      (box.max.x + box.min.x) / 2,
      (box.max.y + box.min.y) / 2,
      (box.max.z + box.min.z) / 2
    )
  }

  /**
   * Disposes of all resources.
   */
  dispose () {
    this.geometry.dispose()
    ;(this.material as THREE.Material).dispose()
  }
}

/**
 * Defines the box mesh for the section box.
 */
export class BoxMesh extends THREE.Mesh {
  constructor () {
    const geo = new THREE.BoxGeometry()
    const mat = new THREE.MeshBasicMaterial({
      opacity: 0.3,
      transparent: true,
      color: new THREE.Color(0x0050bb),
      depthTest: false
    })

    super(geo, mat)
  }

  /**
   * Resize the mesh to the given box.
   */
  fitBox (box: THREE.Box3) {
    this.scale.set(
      box.max.x - box.min.x,
      box.max.y - box.min.y,
      box.max.z - box.min.z
    )
    this.position.set(
      (box.max.x + box.min.x) / 2,
      (box.max.y + box.min.y) / 2,
      (box.max.z + box.min.z) / 2
    )
  }

  /**
   * Disposes of all resources.
   */
  dispose () {
    this.geometry.dispose()
    ;(this.material as THREE.Material).dispose()
  }
}

/**
 * Defines the face highlight on hover for the section box.
 */
export class BoxHighlight extends THREE.Mesh {
  constructor () {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(12), 3)
    )
    geo.setIndex([0, 1, 2, 0, 2, 3])

    const mat = new THREE.MeshBasicMaterial({
      opacity: 0.7,
      transparent: true,
      depthTest: false,
      side: THREE.DoubleSide
    })
    super(geo, mat)
    this.renderOrder = 1
    // Because position is always (0,0,0)
    this.frustumCulled = false
  }

  /**
   * Sets the face to highlight
   * @param normal a direction vector from theses options (X,-X, Y,-Y, Z,-Z)
   */
  highlight (box: THREE.Box3, normal: THREE.Vector3) {
    this.visible = false
    const positions = this.geometry.getAttribute('position')

    if (normal.x > 0.1) {
      positions.setXYZ(0, box.max.x, box.max.y, box.max.z)
      positions.setXYZ(1, box.max.x, box.min.y, box.max.z)
      positions.setXYZ(2, box.max.x, box.min.y, box.min.z)
      positions.setXYZ(3, box.max.x, box.max.y, box.min.z)
      this.visible = true
    }
    if (normal.x < -0.1) {
      positions.setXYZ(0, box.min.x, box.max.y, box.max.z)
      positions.setXYZ(1, box.min.x, box.min.y, box.max.z)
      positions.setXYZ(2, box.min.x, box.min.y, box.min.z)
      positions.setXYZ(3, box.min.x, box.max.y, box.min.z)
      this.visible = true
    }
    if (normal.y > 0.1) {
      positions.setXYZ(0, box.max.x, box.max.y, box.max.z)
      positions.setXYZ(1, box.min.x, box.max.y, box.max.z)
      positions.setXYZ(2, box.min.x, box.max.y, box.min.z)
      positions.setXYZ(3, box.max.x, box.max.y, box.min.z)
      this.visible = true
    }
    if (normal.y < -0.1) {
      positions.setXYZ(0, box.max.x, box.min.y, box.max.z)
      positions.setXYZ(1, box.min.x, box.min.y, box.max.z)
      positions.setXYZ(2, box.min.x, box.min.y, box.min.z)
      positions.setXYZ(3, box.max.x, box.min.y, box.min.z)
      this.visible = true
    }
    if (normal.z > 0.1) {
      positions.setXYZ(0, box.max.x, box.max.y, box.max.z)
      positions.setXYZ(1, box.min.x, box.max.y, box.max.z)
      positions.setXYZ(2, box.min.x, box.min.y, box.max.z)
      positions.setXYZ(3, box.max.x, box.min.y, box.max.z)
      this.visible = true
    }
    if (normal.z < -0.1) {
      positions.setXYZ(0, box.max.x, box.max.y, box.min.z)
      positions.setXYZ(1, box.min.x, box.max.y, box.min.z)
      positions.setXYZ(2, box.min.x, box.min.y, box.min.z)
      positions.setXYZ(3, box.max.x, box.min.y, box.min.z)
      this.visible = true
    }
    positions.needsUpdate = true
  }

  /**
   * Disposes all resources.
   */
  dispose () {
    this.geometry.dispose()
    ;(this.material as THREE.Material).dispose()
  }
}
