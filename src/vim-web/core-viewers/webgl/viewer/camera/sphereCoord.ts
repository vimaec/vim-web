import * as THREE from 'three'

const MIN_PHI = THREE.MathUtils.degToRad(0.5)
const MAX_PHI = THREE.MathUtils.degToRad(179.5)

/**
 * Z-up spherical coordinate. Phi is always clamped to [0.5°, 179.5°].
 * - theta: azimuth around Z axis (radians)
 * - phi: angle from +Z (0 = up, PI = down)
 * - radius: distance from center
 */
export class SphereCoord {
  readonly theta: number
  readonly phi: number
  readonly radius: number

  constructor (theta: number, phi: number, radius: number) {
    this.theta = theta
    this.phi = THREE.MathUtils.clamp(phi, MIN_PHI, MAX_PHI)
    this.radius = radius
  }

  static fromVector (v: THREE.Vector3): SphereCoord {
    const radius = v.length()
    if (radius < 1e-10) return new SphereCoord(0, Math.PI / 2, 0)
    const theta = Math.atan2(v.y, v.x)
    const phi = Math.acos(THREE.MathUtils.clamp(v.z / radius, -1, 1))
    return new SphereCoord(theta, phi, radius)
  }

  static fromForward (forward: THREE.Vector3, radius: number): SphereCoord {
    return SphereCoord.fromVector(forward.clone().negate().multiplyScalar(radius))
  }

  rotate (dThetaDeg: number, dPhiDeg: number): SphereCoord {
    return new SphereCoord(
      this.theta + (dThetaDeg * Math.PI) / 180,
      this.phi + (dPhiDeg * Math.PI) / 180,
      this.radius
    )
  }

  toVector3 (): THREE.Vector3 {
    const sinPhi = Math.sin(this.phi)
    return new THREE.Vector3(
      this.radius * sinPhi * Math.cos(this.theta),
      this.radius * sinPhi * Math.sin(this.theta),
      this.radius * Math.cos(this.phi)
    )
  }
}
