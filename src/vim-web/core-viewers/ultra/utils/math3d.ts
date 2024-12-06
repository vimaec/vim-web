export class Vector3 {
  x: number
  y: number
  z: number

  constructor (x: number = 0, y: number = 0, z: number = 0) {
    this.x = x
    this.y = y
    this.z = z
  }

  set (x: number, y: number, z: number): this {
    this.x = x
    this.y = y
    this.z = z
    return this
  }

  copy (v: Vector3): this {
    this.x = v.x
    this.y = v.y
    this.z = v.z
    return this
  }

  add (v: Vector3): this {
    this.x += v.x
    this.y += v.y
    this.z += v.z
    return this
  }

  sub (v: Vector3): this {
    this.x -= v.x
    this.y -= v.y
    this.z -= v.z
    return this
  }

  multiplyScalar (scalar: number): this {
    this.x *= scalar
    this.y *= scalar
    this.z *= scalar
    return this
  }

  min (v: Vector3): this {
    this.x = Math.min(this.x, v.x)
    this.y = Math.min(this.y, v.y)
    this.z = Math.min(this.z, v.z)
    return this
  }

  max (v: Vector3): this {
    this.x = Math.max(this.x, v.x)
    this.y = Math.max(this.y, v.y)
    this.z = Math.max(this.z, v.z)
    return this
  }

  isValid (): boolean {
    return Number.isFinite(this.x) && Number.isFinite(this.y) && Number.isFinite(this.z)
  }

  equals (v: Vector3): boolean {
    return this.x === v.x && this.y === v.y && this.z === v.z
  }

  toArray (): number[] {
    return [this.x, this.y, this.z]
  }
}

export class Vector2 {
  x: number
  y: number

  constructor (x: number = 0, y: number = 0) {
    this.x = x
    this.y = y
  }

  set (x: number, y: number): this {
    this.x = x
    this.y = y
    return this
  }

  copy (v: Vector2): this {
    this.x = v.x
    this.y = v.y
    return this
  }

  add (v: Vector2): this {
    this.x += v.x
    this.y += v.y
    return this
  }

  sub (v: Vector2): this {
    this.x -= v.x
    this.y -= v.y
    return this
  }

  multiplyScalar (scalar: number): this {
    this.x *= scalar
    this.y *= scalar
    return this
  }

  min (v: Vector2): this {
    this.x = Math.min(this.x, v.x)
    this.y = Math.min(this.y, v.y)
    return this
  }

  max (v: Vector2): this {
    this.x = Math.max(this.x, v.x)
    this.y = Math.max(this.y, v.y)
    return this
  }

  equals (v: Vector2): boolean {
    return this.x === v.x && this.y === v.y
  }

  isValid (): boolean {
    return Number.isFinite(this.x) && Number.isFinite(this.y)
  }

  almostEquals (v: Vector2, tolerance : number = Number.EPSILON): boolean {
    return Math.abs(this.x - v.x) < tolerance && Math.abs(this.y - v.y) < tolerance
  }

  toArray (): number[] {
    return [this.x, this.y]
  }

  distanceTo (v: Vector2): number {
    const dx = this.x - v.x
    const dy = this.y - v.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  clamp01 (): this {
    this.x = clamp(this.x, 0, 1)
    this.y = clamp(this.y, 0, 1)
    return this
  }
}

export class Segment {
  origin: Vector3
  target: Vector3

  constructor (origin: Vector3 = new Vector3(), target: Vector3 = new Vector3()) {
    this.origin = origin
    this.target = target
  }

  static fromArray (array: number[]): Segment {
    return new Segment(
      new Vector3(array[0], array[1], array[2]),
      new Vector3(array[3], array[4], array[5])
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

export class Box3 {
  min: Vector3
  max: Vector3

  constructor (min: Vector3 = new Vector3(Infinity, Infinity, Infinity), max: Vector3 = new Vector3(-Infinity, -Infinity, -Infinity)) {
    this.min = min
    this.max = max
  }

  static fromArray (array: number[]): Box3 {
    return new Box3().set(
      new Vector3(array[0], array[1], array[2]),
      new Vector3(array[3], array[4], array[5])
    )
  }

  isValid (): boolean {
    return this.min.x <= this.max.x && this.min.y <= this.max.y && this.min.z <= this.max.z
  }

  set (min: Vector3, max: Vector3): this {
    this.min.copy(min)
    this.max.copy(max)
    return this
  }

  setFromPoints (points: Vector3[]): this {
    this.min.set(Infinity, Infinity, Infinity)
    this.max.set(-Infinity, -Infinity, -Infinity)

    points.forEach(point => {
      this.min.min(point)
      this.max.max(point)
    })

    return this
  }

  getCenter (target: Vector3 = new Vector3()): Vector3 {
    return target.copy(this.min).add(this.max).multiplyScalar(0.5)
  }

  getSize (target: Vector3 = new Vector3()): Vector3 {
    return target.copy(this.max).sub(this.min)
  }

  containsPoint (point: Vector3): boolean {
    return point.x >= this.min.x && point.x <= this.max.x &&
             point.y >= this.min.y && point.y <= this.max.y &&
             point.z >= this.min.z && point.z <= this.max.z
  }

  intersectsBox (box: Box3): boolean {
    return !(box.max.x < this.min.x || box.min.x > this.max.x ||
               box.max.y < this.min.y || box.min.y > this.max.y ||
               box.max.z < this.min.z || box.min.z > this.max.z)
  }

  expandByPoint (point: Vector3): this {
    this.min.min(point)
    this.max.max(point)
    return this
  }

  union (box: Box3): this {
    this.min.min(box.min)
    this.max.max(box.max)
    return this
  }

  toArray (): number[] {
    return [this.min.x, this.min.y, this.min.z, this.max.x, this.max.y, this.max.z]
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
      remap(r, 255),
      remap(g, 255),
      remap(b, 255),
      remap(a, 255)
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

/**
 * Remaps the given value from the range [0-1] to [0-max].
 */
export function remap (value: number, max: number): number {
  return Math.round(clamp(value, 0, 1) * max)
}

/**
 * Clamps the given value between the given min and max.
 */
export function clamp (value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min
  }
  return Math.min(Math.max(value, min), max)
}
