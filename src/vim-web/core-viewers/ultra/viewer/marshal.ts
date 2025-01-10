/**
 * Don't modify this file, the RPC generated code depends on its interface.
 */

import { Box3, RGB, RGBA, RGBA32, Segment, Vector2, Vector3, Matrix44 } from "../utils/math3d";

export type HitCheckResult = {
  vimHandle: number;         // uint32_t equivalent
  nodeIndex: number;         // uint32_t equivalent
  worldPosition: Vector3;  // 3-element array of floats
  worldNormal: Vector3;    // 3-element array of floats
}

export type VimStatus = {
  status: number;    // uint32_t equivalent
  progress: number;  // float equivalent
}

export type Vector4 = {
  x: number;         // float equivalent
  y: number;         // float equivalent
  z: number;         // float equivalent
  w: number;         // float equivalent
}

export class Marshal {
  private buffer: ArrayBuffer
  private dataView: DataView
  private readOffset: number = 0
  private writeOffset: number = 0

  constructor(initialSize: number = 1024) {
    this.buffer = new ArrayBuffer(initialSize)
    this.dataView = new DataView(this.buffer)
  }

  public getBuffer(): ArrayBuffer {
    return this.buffer.slice(0, this.writeOffset)
  }

  private ensureCapacity(additionalSize: number): void {
    const requiredSize = this.writeOffset + additionalSize
    if (requiredSize > this.buffer.byteLength) {
      let newLength = this.buffer.byteLength
      while (newLength < requiredSize) {
        newLength *= 2
      }
      const newBuffer = new ArrayBuffer(newLength)
      new Uint8Array(newBuffer).set(new Uint8Array(this.buffer))
      this.buffer = newBuffer
      this.dataView = new DataView(this.buffer)
    }
  }

  public writeData(data: ArrayBuffer): void {
    this.ensureCapacity(data.byteLength)
    new Uint8Array(this.buffer, this.writeOffset).set(new Uint8Array(data))
    this.writeOffset += data.byteLength
  }
  // -------------------- Matrix44 Methods --------------------

  public writeMatrix44(data: Matrix44): void {
    this.ensureCapacity(4 * 4 * 4)
    this.writeArray(data.toArray(), 4, (element) => {
      this.writeFloat(element)
    })
  }

  public readMatrix44(): Matrix44 {
    //  First row
    const m00 = this.readFloat()
    const m01 = this.readFloat()
    const m02 = this.readFloat()
    const m03 = this.readFloat()

    //  Second row
    const m10 = this.readFloat()
    const m11 = this.readFloat()
    const m12 = this.readFloat()
    const m13 = this.readFloat()

    //  Third row
    const m20 = this.readFloat()
    const m21 = this.readFloat()
    const m22 = this.readFloat()
    const m23 = this.readFloat()

    //  Fourth row
    const m30 = this.readFloat()
    const m31 = this.readFloat()
    const m32 = this.readFloat()
    const m33 = this.readFloat()

    return new Matrix44(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33)
  }

  // -------------------- Boolean Methods --------------------

  public writeBoolean(value: boolean): void {
    this.ensureCapacity(4)
    this.dataView.setUint32(this.writeOffset, value ? 1 : 0, true)
    this.writeOffset += 4
  }

  public readBoolean(): boolean {
    const value = this.dataView.getUint32(this.readOffset, true)
    this.readOffset += 4
    return value !== 0
  }

  // -------------------- Int Methods --------------------

  public writeInt(value: number): void {
    this.ensureCapacity(4)
    this.dataView.setInt32(this.writeOffset, value, true)
    this.writeOffset += 4
  }

  public readInt(): number {
    const value = this.dataView.getInt32(this.readOffset, true)
    this.readOffset += 4
    return value
  }

  // -------------------- UInt Methods --------------------

  public writeUInt(value: number): void {
    this.ensureCapacity(4)
    this.dataView.setUint32(this.writeOffset, value, true)
    this.writeOffset += 4
  }

  public readUInt(): number {
    const value = this.dataView.getUint32(this.readOffset, true)
    this.readOffset += 4
    return value
  }

  // -------------------- Float Methods --------------------

  public writeFloat(value: number): void {
    this.ensureCapacity(4)
    this.dataView.setFloat32(this.writeOffset, value, true)
    this.writeOffset += 4
  }

  public readFloat(): number {
    const value = this.dataView.getFloat32(this.readOffset, true)
    this.readOffset += 4
    return value
  }

  // -------------------- String Methods --------------------

  public writeString(value: string): void {
    const textEncoder = new TextEncoder()
    const encodedString = textEncoder.encode(value + '\0') // Include null terminator
    this.ensureCapacity(4 + encodedString.byteLength)
    this.writeUInt(encodedString.length)
    new Uint8Array(this.buffer, this.writeOffset).set(encodedString)
    this.writeOffset += encodedString.length
  }

  public readString(): string {
    const length = this.readUInt()
    const textDecoder = new TextDecoder()
    const stringData = new Uint8Array(this.buffer, this.readOffset, length - 1) // Exclude null terminator
    this.readOffset += length
    return textDecoder.decode(stringData)
  }

  // -------------------- HitCheckResult Methods --------------------

  public writeHitCheckResult(data: HitCheckResult): void {
    this.ensureCapacity(4 + 4 + 4 * 3 + 4 * 3)
    this.writeUInt(data.vimHandle)
    this.writeUInt(data.nodeIndex)
    this.writeVector3(data.worldPosition)
    this.writeVector3(data.worldNormal)
  }

  public readHitCheckResult(): HitCheckResult {
    const vimHandle = this.readUInt()
    const nodeIndex = this.readUInt()

    const worldPosition = this.readVector3()
    const worldNormal = this.readVector3()

    return {
      vimHandle,
      nodeIndex,
      worldPosition,
      worldNormal
    }
  }

  // -------------------- VimStatus Methods --------------------

  public writeVimStatus(data: VimStatus): void {
    this.ensureCapacity(4 + 4)
    this.writeUInt(data.status)
    this.writeFloat(data.progress)
  }

  public readVimStatus(): VimStatus {
    const status = this.readUInt()
    const progress = this.readFloat()

    return {
      status,
      progress,
    }
  }

  // -------------------- Vector2 Methods --------------------

  public writeVector2(data: Vector2): void {
    this.ensureCapacity(4 + 4)
    this.writeFloat(data.x)
    this.writeFloat(data.y)
  }

  public readVector2(): Vector2 {
    const x = this.readFloat()
    const y = this.readFloat()
    return new Vector2(x, y)
  }

  // -------------------- Vector3 Methods --------------------

  public writeVector3(data: Vector3): void {
    this.ensureCapacity(4 + 4 + 4)
    this.writeFloat(data.x)
    this.writeFloat(data.y)
    this.writeFloat(data.z)
  }

  public readVector3(): Vector3 {
    const x = this.readFloat()
    const y = this.readFloat()
    const z = this.readFloat()
    return new Vector3(x, y, z)
  }

  // -------------------- Vector4 Methods --------------------

  public writeVector4(data: Vector4): void {
    this.ensureCapacity(4 + 4 + 4 + 4)
    this.writeFloat(data.x)
    this.writeFloat(data.y)
    this.writeFloat(data.z)
    this.writeFloat(data.w)
  }

  public readVector4(): Vector4 {
    const x = this.readFloat()
    const y = this.readFloat()
    const z = this.readFloat()
    const w = this.readFloat()

    return {
      x,
      y,
      z,
      w,
    }
  }

  // -------------------- RGBA Methods --------------------

  public writeRGBA(color: RGBA): void {
    this.ensureCapacity(4 + 4 + 4 + 4)
    this.writeFloat(color.r)
    this.writeFloat(color.g)
    this.writeFloat(color.b)
    this.writeFloat(color.a)
  }

  public readRGBA(): RGBA {
    const r = this.readFloat()
    const g = this.readFloat()
    const b = this.readFloat()
    const a = this.readFloat()
    return new RGBA(r, g, b, a)
  }

  // -------------------- RGB Methods --------------------

  public writeRGB(color: RGBA): void {
    this.ensureCapacity(4 + 4 + 4 + 4)
    this.writeFloat(color.r)
    this.writeFloat(color.g)
    this.writeFloat(color.b)
  }

  public readRGB(): RGB {
    const r = this.readFloat()
    const g = this.readFloat()
    const b = this.readFloat()
    return new RGB(r, g, b)
  }

  // -------------------- RGBA32 Methods --------------------

  public writeRGBA32(color: RGBA32): void {
    this.ensureCapacity(4)    
    this.writeUInt(color.hex)
  }

  public readRGBA32(): RGBA32 {
    const hex = this.readUInt()
    return new RGBA32(hex)
  }

  // -------------------- CameraPositionAndTarget Methods --------------------

  public writeSegment(segment: Segment): void {
    this.ensureCapacity(4 * 3 * 2)
    this.writeVector3(segment.origin)
    this.writeVector3(segment.target)
  }

  public readSegment(): Segment {
    const position = this.readVector3()
    const target = this.readVector3()
    return new Segment(position, target)
  }
  // -------------------- Box3 Methods --------------------

  public writeBox3(data: Box3): void {
    this.ensureCapacity(4 * 3 * 2)
    this.writeVector3(data.min)
    this.writeVector3(data.max)
  }

  public readBox3(): Box3 {
    const min = this.readVector3()
    const max = this.readVector3()

    return new Box3(min, max)
  }

  // -------------------- Array of Int Methods --------------------

  public writeArrayOfInt(values: number[]): void {
    this.writeArray(values, 4, (v) => this.writeInt(v))
  }

  public readArrayOfInt(): number[] {
    return this.readArray(() => this.readInt())
  }

  // -------------------- Array of UInt Methods --------------------

  public writeArrayOfUInt(values: number[]): void {
    this.writeArray(values, 4, (v) => this.writeUInt(v))
  }

  public readArrayOfUInt(): number[] {
    return this.readArray(() => this.readUInt())
  }

  // -------------------- Array of Float Methods --------------------

  public writeArrayOfFloat(values: number[]): void {
    this.writeArray(values, 4, (v) => this.writeFloat(v))
  }

  public readArrayOfFloat(): number[] {
    return this.readArray(() => this.readFloat())
  }

  // -------------------- Array of Bool Methods --------------------

  public writeArrayOfBool(values: boolean[]): void {
    this.writeArray(values, 4, (v) => this.writeBoolean(v))
  }

  public readArrayOfBool(): boolean[] {
    return this.readArray(() => this.readBoolean())
  }
  // -------------------- Array of RGBA32 Methods --------------------

  public writeArrayOfRGBA32(values: RGBA32[]): void {
    this.writeArray(values, 4, (v) => this.writeRGBA32(v))
  }

  public readArrayOfRGBA32(): RGBA32[] {
    return this.readArray(() => this.readRGBA32())
  }

  // -------------------- Helpers --------------------
  writeArray<T>(data: T[], sizeT: number, write: (data: T) => void, ): void {
    this.ensureCapacity(4 + data.length * sizeT)
    this.writeUInt(data.length) // First write the length of the array
    data.forEach(value => write(value))
  
  }

  public readArray<T>(read: () => T): T[] {
    const length = this.readUInt()
    const array = []
    for (let i = 0; i < length; i++) {
      array.push(read())
    }
    return array
  }
}

