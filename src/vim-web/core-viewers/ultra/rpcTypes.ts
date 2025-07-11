import * as Utils from '../../utils'
import * as THREE from 'three'

export {Vector2, Vector3, Box3, Matrix4 as Matrix44 } from 'three'

export class Segment {
  origin: THREE.Vector3
  target: THREE.Vector3

  constructor (origin: THREE.Vector3 = new THREE.Vector3(), target: THREE.Vector3 = new THREE.Vector3()) {
    this.origin = origin
    this.target = target
  }

  static fromArray (array: number[]): Segment {
    return new Segment(
      new THREE.Vector3(array[0], array[1], array[2]),
      new THREE.Vector3(array[3], array[4], array[5])
    )
  }

  toArray (): number[] {
    return [this.origin.x, this.origin.y, this.origin.z, this.target.x, this.target.y, this.target.z]
  }

  isValid (): boolean {
    return !this.origin.equals(this.target)
  }

  equals (segment: Segment): boolean {
    return this.origin.equals(segment.origin) && this.target.equals(segment.target)
  }
}

export class RGBA {
  r: number
  g: number
  b: number
  a: number

  constructor (r: number, g: number, b: number, a: number = 1) {
    this.r = r
    this.g = g
    this.b = b
    this.a = a
  }

  clone(): RGBA {
    return new RGBA(this.r, this.g, this.b, this.a)
  }

  isValid (): boolean {
    return Number.isFinite(this.r) &&
      Number.isFinite(this.g) &&
      Number.isFinite(this.b) &&
      Number.isFinite(this.a)
  }

  equals (color: RGBA): boolean {
    return this.r === color.r && this.g === color.g && this.b === color.b && this.a === color.a
  }

  static fromString (str: string): RGBA {
    // Remove any whitespace
    str = str.trim()

    // Remove any leading or trailing parentheses
    if (str.startsWith('(')) {
      str = str.substring(1)
    }
    if (str.endsWith(')')) {
      str = str.substring(0, str.length - 1)
    }

    // Split the string by commas
    const parts = str.split(',')

    if (parts.length < 3 || parts.length > 4) {
      throw new Error('Invalid color string format. Expected 3 or 4 components.')
    }

    // Parse the components
    const r = parseFloat(parts[0])
    const g = parseFloat(parts[1])
    const b = parseFloat(parts[2])
    const a = parts.length === 4 ? parseFloat(parts[3]) : 1

    // Validate the components
    if ([r, g, b, a].some((n) => isNaN(n))) {
      throw new Error('Invalid number in color string.')
    }

    return new RGBA(r, g, b, a)
  }
}

export class RGB {
  r: number
  g: number
  b: number

  constructor (r: number, g: number, b: number) {
    this.r = r
    this.g = g
    this.b = b
  }
}

export class RGBA32 {
  readonly hex: number
  constructor (
    hex: number
  ) {
    if (!Number.isInteger(hex) || hex < 0 || hex > 0xffffffff) {
      throw new Error('Invalid value: must be a 32-bit unsigned integer')
    }
    this.hex = hex
  }

  static fromInts (r: number, g: number, b: number, a: number = 1): RGBA32 {
    // Ensure each component is within the valid range (0-255)
    if (
      r < 0 || r > 255 ||
      g < 0 || g > 255 ||
      b < 0 || b > 255 ||
      a < 0 || a > 255
    ) {
      throw new Error('Each RGBA component must be in the range 0-255.')
    }
    // Combine the components into a single 32-bit number
    const hex = (r * (2 ** 24)) + (g * (2 ** 16)) + (b * (2 ** 8)) + a
    return new RGBA32(hex)
  }

  static fromFloats (r: number, g: number, b: number, a: number = 1): RGBA32 {
    return this.fromInts(
      Utils.remap(r, 255),
      Utils.remap(g, 255),
      Utils.remap(b, 255),
      Utils.remap(a, 255)
    )
  }

  static fromString (str: string): RGBA32 {
    // Remove any leading '#' character
    if (str.startsWith('#')) {
      str = str.slice(1)
    }

    // Expand shorthand notation (e.g., 'FFF' or 'F0F8')
    if (str.length === 3 || str.length === 4) {
      str = str
        .split('')
        .map((c) => c + c)
        .join('')
    }

    let r = 0
    let g = 0
    let b = 0
    let a = 255 // Default alpha to 255 (opaque)

    if (str.length === 6 || str.length === 8) {
      r = parseInt(str.slice(0, 2), 16)
      g = parseInt(str.slice(2, 4), 16)
      b = parseInt(str.slice(4, 6), 16)
      if (str.length === 8) {
        a = parseInt(str.slice(6, 8), 16)
      }
    } else {
      throw new Error('Invalid color string format')
    }

    if ([r, g, b, a].some((v) => isNaN(v))) {
      throw new Error('Invalid color string format')
    }

    return this.fromInts(r, g, b, a)
  }

  /**
   * The red component of the color in the range [0-255].
   */
  get r (): number {
    return this.hex >>> 24
  }

  /**
   * The green component of the color in the range [0-255].
   */
  get g (): number {
    return (this.hex >>> 16) & 0xff
  }

  /**
   * The blue component of the color in the range [0-255].
   */
  get b (): number {
    return (this.hex >>> 8) & 0xff
  }

  /**
   * The alpha component of the color in the range [0-255].
   */
  get a (): number {
    return this.hex & 0xff
  }
}

export type HitCheckResult = {
  vimIndex: number;         // uint32_t equivalent
  vimElementIndex: number; // uint32_t equivalent
  sceneElementIndex: number; // uint32_t equivalent
  worldPosition: THREE.Vector3;  // 3-element array of floats
  worldNormal: THREE.Vector3;    // 3-element array of floats
}

export type VimStatus = {
  status: number;    // uint32_t equivalent
  progress: number;  // float equivalent
}

export type SectionBoxState = {
  visible: boolean;       // bool equivalent
  interactive: boolean;  // bool equivalent
  clip : boolean;         // bool equivalent
  box: THREE.Box3;              // Box3 equivalent
}
