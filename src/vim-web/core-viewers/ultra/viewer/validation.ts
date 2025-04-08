import { Box3, RGB, RGBA, Segment, Vector2, Vector3 } from '../../utils/math3d'
import { isURL } from '../../utils/url'
import { MaterialHandle, materialHandles } from '../viewer/rpcClient'
import { INVALID_HANDLE } from './viewer'

export class Validation {
  //= ===========================================================================
  // BASIC NUMBER VALIDATIONS
  //= ===========================================================================
  static isNumber (value: number): boolean {
    if (!Number.isFinite(value)) {
      console.warn('Invalid value: must be a finite number. Aborting operation.')
      return false
    }
    return true
  }

  static isPositiveNumber (value: number): boolean {
    if (!this.isNumber(value)) return false
    if (value < 0) {
      console.warn('Invalid value: must be a non-negative number. Aborting operation.')
      return false
    }
    return true
  }

  static isInteger (value: number): boolean {
    if (!Number.isInteger(value)) {
      console.warn('Invalid value: must be an integer. Aborting operation.')
      return false
    }
    return true
  }

  static isPositiveInteger (value: number): boolean {
    if (!Number.isInteger(value)) {
      console.warn('Invalid value: must be a positive integer. Aborting operation.')
      return false
    }

    if (value < 0) {
      console.warn('Invalid value: must be a positive integer. Aborting operation.')
      return false
    }
    return true
  }

  static isInRange01 (value: number): boolean {
    if (!this.isNumber(value)) return false
    if (value < 0 || value > 1) {
      console.warn('Invalid value: must be a relative number (0-1). Aborting operation.')
      return false
    }
    return true
  }

  static areIntegers (values: number[]): boolean {
    return values.every((i) => this.isInteger(i))
  }

  //= ===========================================================================
  // HANDLE VALIDATIONS
  //= ===========================================================================
  static isComponentHandle (handle: number): boolean {
    if (!this.isPositiveInteger(handle)) return false
    if (handle === INVALID_HANDLE) {
      console.warn(`Invalid handle ${handle}. Aborting operation.`)
      return false
    }
    return true
  }

  static areComponentHandles (handles: number[]): boolean {
    return handles.every((h) => this.isComponentHandle(h))
  }

  static isMaterialHandle (handle: number): boolean {
    if (!materialHandles.includes(handle as MaterialHandle)) {
      console.warn(`Invalid material handle ${handle}. Aborting operation.`)
      return false
    }
    return true
  }

  //= ===========================================================================
  // VECTOR AND GEOMETRY VALIDATIONS
  //= ===========================================================================
  static isValidVector2 (value: Vector2): boolean {
    
    if (!Number.isFinite(value.x) || !Number.isFinite(value.y)) {
      console.warn('Invalid value: must be a valid Vector2. Aborting operation.')
      return false
    }
    return true
  }

  static isRelativeVector2 (value: Vector2): boolean {
    if(!this.isValidVector2(value)) return false
    if (value.x < 0 || value.x > 1 || value.y < 0 || value.y > 1) {
      console.warn('Invalid value: must be a relative Vector2 (0-1, 0-1). Aborting operation.')
      return false
    }
    return true
  }

  static isValidVector3 (value: Vector3): boolean {
    if (!Number.isFinite(value.x) || !Number.isFinite(value.y) || !Number.isFinite(value.z)) {
      console.warn('Invalid Vector3. Aborting operation.')
      return false
    }
    return true
  }

  static isValidBox (box: Box3): boolean {
    if (box.isEmpty()) {
      console.warn('Box is invalid. Min values must be less than max values')
      return false
    }
    return true
  }

  static isValidSegment (segment: Segment): boolean {
    if (!segment.isValid()) {
      console.warn('Segment is invalid. Origin must be different from target')
      return false
    }
    return true
  }

  //= ===========================================================================
  // COLOR VALIDATIONS
  //= ===========================================================================
  static isRelativeRGBA (color: RGBA): boolean {
    if (color.r < 0 || color.r > 1 || color.g < 0 || color.g > 1 || color.b < 0 || color.b > 1) {
      console.warn('Invalid value: must be a relative color (0-1, 0-1, 0-1)')
      return false
    }
    return true
  }

  static isRelativeRGB (color: RGB): boolean {
    if (color.r < 0 || color.r > 1 || color.g < 0 || color.g > 1 || color.b < 0 || color.b > 1) {
      console.warn('Invalid value: must be a relative color (0-1, 0-1, 0-1)')
      return false
    }
    return true
  }

  //= ===========================================================================
  // STRING AND URL VALIDATIONS
  //= ===========================================================================
  static isNonEmptyString (value: string): boolean {
    if (typeof value !== 'string' || value.trim() === '') {
      console.warn('Invalid value: must be a non-empty string. Aborting operation.')
      return false
    }
    return true
  }

  static isURL (value: string): boolean {
    if (!isURL(value)) {
      console.warn('Invalid value: must be a valid URL. Aborting operation.')
      return false
    }
    return true
  }

  //= ===========================================================================
  // ARRAY VALIDATIONS
  //= ===========================================================================
  static areSameLength<T1, T2> (array: T1[], array2: T2[]): boolean {
    if (array.length !== array2.length) {
      console.warn('Arrays must be of the same length. Aborting operation.')
      return false
    }
    return true
  }

  static isFullArray (array: any[]): boolean {
    if (!Array.isArray(array)) {
      console.warn('Invalid value: must be an array. Aborting operation.')
      return false
    }
    if (array.length === 0) {
      console.warn('Invalid value: array must not be empty. Aborting operation.')
      return false
    }

    // Check for undefined values or sparse arrays
    for (let i = 0; i < array.length; i++) {
      if (array[i] === undefined) {
        console.warn('Invalid value: array must not contain undefined values. Aborting operation.')
        return false
      }
    }
    return true
  }

  //= ===========================================================================
  // UTILITY METHODS FOR NUMBER CONSTRAINTS
  //= ===========================================================================
  static clamp (min: number, max: number, value: number): number {
    if (!Number.isFinite(value)) {
      console.warn('Invalid value: must be a finite number. Clamping to min.')
      return min
    }
    if (value < min) {
      console.warn(`Invalid value: must be greater than or equal to ${min}. Clamping to ${min}.`)
      return min
    }
    if (value > max) {
      console.warn(`Invalid value: must be less than or equal to ${max}. Clamping to ${max}.`)
      return max
    }
    return value
  }

  static clamp01 (value: number): number {
    if (!Number.isFinite(value)) {
      console.warn('Invalid value: must be a finite number. Clamping to 0.')
    }
    if (value < 0) {
      console.warn('Invalid value: must be a non-negative number. Clamping to 0.')
      return 0
    }
    if (value > 1) {
      console.warn('Invalid value: must be a relative number (0-1). Clamping to 1.')
      return 1
    }
    return value
  }

  static min0 (value: number): number {
    if (!Number.isFinite(value)) {
      console.warn('Invalid value: must be a finite number. Clamping to 0.')
      return 0
    }
    if (value < 0) {
      console.warn('Invalid value: must be a non-negative number. Clamping to 0.')
      return 0
    }
    return value
  }

  static clampRGBA01 (value: RGBA): RGBA {
    return new RGBA(
      this.clamp01(value.r),
      this.clamp01(value.g),
      this.clamp01(value.b),
      this.clamp01(value.a)
    )
  }

  static clampRGB01 (value: RGBA): RGBA {
    return new RGBA(
      this.clamp01(value.r),
      this.clamp01(value.g),
      this.clamp01(value.b)
    )
  }
}
