/**
 * Don't modify this file, the RPC generated code depends on its interface.
 */

import * as RpcTypes from "./rpcTypes";


export class Marshal {
  private buffer: ArrayBuffer
  private _dataView: DataView
  private _offset: number = 0

  constructor(initialSize: number = 1024) {
    this.buffer = new ArrayBuffer(initialSize)
    this._dataView = new DataView(this.buffer)
  }

  public getBuffer(): ArrayBuffer {
    return this.buffer.slice(0, this._offset)
  }

  private ensureCapacity(additionalSize: number): void {
    const requiredSize = this._offset + additionalSize
    if (requiredSize > this.buffer.byteLength) {
      let newLength = this.buffer.byteLength
      while (newLength < requiredSize) {
        newLength *= 2
      }
      const newBuffer = new ArrayBuffer(newLength)
      new Uint8Array(newBuffer).set(new Uint8Array(this.buffer))
      this.buffer = newBuffer
      this._dataView = new DataView(this.buffer)
    }
  }

  public writeData(data: ArrayBuffer): void {
    this.ensureCapacity(data.byteLength)
    new Uint8Array(this.buffer, this._offset).set(new Uint8Array(data))
    this._offset += data.byteLength
  }
  // -------------------- Matrix44 -------------------

  public writeMatrix44(data: RpcTypes.Matrix44): void {
    this.ensureCapacity(4 * 4 * 4)
    this.writeArray(data.toArray(), 4, (element) => {
      this.writeFloat(element)
    })
  }

 

  // -------------------- Boolean -------------------

  public writeBoolean(value: boolean): void {
    this.ensureCapacity(4)
    this._dataView.setUint32(this._offset, value ? 1 : 0, true)
    this._offset += 4
  }


  // -------------------- Int -------------------

  public writeInt(value: number): void {
    this.ensureCapacity(4)
    this._dataView.setInt32(this._offset, value, true)
    this._offset += 4
  }



  // -------------------- UInt -------------------

  public writeUInt(value: number): void {
    this.ensureCapacity(4)
    this._dataView.setUint32(this._offset, value, true)
    this._offset += 4
  }


  // -------------------- Float -------------------

  public writeFloat(value: number): void {
    this.ensureCapacity(4)
    this._dataView.setFloat32(this._offset, value, true)
    this._offset += 4
  }



  // -------------------- String -------------------

  public writeString(value: string): void {
    const textEncoder = new TextEncoder()
    const encodedString = textEncoder.encode(value + '\0') // Include null terminator
    this.ensureCapacity(4 + encodedString.byteLength)
    this.writeUInt(encodedString.length)
    new Uint8Array(this.buffer, this._offset).set(encodedString)
    this._offset += encodedString.length
  }



  // -------------------- HitCheckResult -------------------

  public writeHitCheckResult(data: RpcTypes.HitCheckResult): void {
    this.ensureCapacity(4 + 4 +4 + 4 * 3 + 4 * 3)
    this.writeUInt(data.vimHandle)
    this.writeUInt(data.nodeIndex)
    this.writeUInt(data.elementIndex)
    this.writeVector3(data.worldPosition)
    this.writeVector3(data.worldNormal)
  }



  // -------------------- VimStatus -------------------

  public writeVimStatus(data: RpcTypes.VimStatus): void {
    this.ensureCapacity(4 + 4)
    this.writeUInt(data.status)
    this.writeFloat(data.progress)
  }


  // -------------------- Vector2 -------------------

  public writeVector2(data: RpcTypes.Vector2): void {
    this.ensureCapacity(4 + 4)
    this.writeFloat(data.x)
    this.writeFloat(data.y)
  }



  // -------------------- Vector3 -------------------

  public writeVector3(data: RpcTypes.Vector3): void {
    this.ensureCapacity(4 + 4 + 4)
    this.writeFloat(data.x)
    this.writeFloat(data.y)
    this.writeFloat(data.z)
  }
 
  // -------------------- RGBA -------------------

  public writeRGBA(color: RpcTypes.RGBA): void {
    this.ensureCapacity(4 + 4 + 4 + 4)
    this.writeFloat(color.r)
    this.writeFloat(color.g)
    this.writeFloat(color.b)
    this.writeFloat(color.a)
  }

  // -------------------- RGB -------------------

  public writeRGB(color: RpcTypes.RGB): void {
    this.ensureCapacity(4 + 4 + 4)
    this.writeFloat(color.r)
    this.writeFloat(color.g)
    this.writeFloat(color.b)
  }


  // -------------------- RGBA32 -------------------

  public writeRGBA32(color: RpcTypes.RGBA32): void {
    this.ensureCapacity(4)    
    this.writeUInt(color.hex)
  }



  // -------------------- CameraPositionAndTarget -------------------

  public writeSegment(segment: RpcTypes.Segment): void {
    this.ensureCapacity(4 * 3 * 2)
    this.writeVector3(segment.origin)
    this.writeVector3(segment.target)
  }


  // -------------------- Box3 -------------------

  public writeBox3(data: RpcTypes.Box3): void {
    this.ensureCapacity(4 * 3 * 2)
    this.writeVector3(data.min)
    this.writeVector3(data.max)
  }


  // -------------------- SectionBox -------------------

  public writeSectionBoxState(data: RpcTypes.SectionBoxState): void {
    this.writeBoolean(data.visible)
    this.writeBoolean(data.interactive)
    this.writeBoolean(data.clip)
    this.writeBox3(data.box)
  }



  // -------------------- Array of Int -------------------

  public writeArrayOfInt(values: number[]): void {
    this.writeArray(values, 4, (v) => this.writeInt(v))
  }



  // -------------------- Array of UInt -------------------

  public writeArrayOfUInt(values: number[]): void {
    this.writeArray(values, 4, (v) => this.writeUInt(v))
  }


  // -------------------- Array of Float -------------------

  public writeArrayOfFloat(values: number[]): void {
    this.writeArray(values, 4, (v) => this.writeFloat(v))
  }



  // -------------------- Array of Bool -------------------

  public writeArrayOfBool(values: boolean[]): void {
    this.writeArray(values, 4, (v) => this.writeBoolean(v))
  }


  // -------------------- Array of RGBA32 -------------------

  public writeArrayOfRGBA32(values: RpcTypes.RGBA32[]): void {
    this.writeArray(values, 4, (v) => this.writeRGBA32(v))
  }


  // -------------------- Helpers --------------------
  writeArray<T>(data: T[], sizeT: number, write: (data: T) => void, ): void {
    this.ensureCapacity(4 + data.length * sizeT)
    this.writeUInt(data.length) // First write the length of the array
    data.forEach(value => write(value))
  
  }
}

export class ReadMarshal{
  private _dataView: DataView
  private _offset: number = 0

  constructor(buffer: ArrayBuffer) {
    this._dataView = new DataView(buffer)
  }

  public readMatrix44(): RpcTypes.Matrix44 {
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

    return new RpcTypes.Matrix44(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33)
  }
  public readInt(): number {
    const value = this._dataView.getInt32(this._offset, true)
    this._offset += 4
    return value
  }

  public readUInt(): number {
    const value = this._dataView.getUint32(this._offset, true)
    this._offset += 4
    return value
  }

  //TODO: Maybe wrong
  public readUInt64(): bigint {
    const low = this.readUInt();  // lower 32 bits
    const high = this.readUInt(); // upper 32 bits
    return (BigInt(high) << 32n) | BigInt(low);
  }

  public readFloat(): number {
    const value = this._dataView.getFloat32(this._offset, true)
    this._offset += 4
    return value
  }
  public readBoolean(): boolean {
    const value = this._dataView.getUint32(this._offset, true)
    this._offset += 4
    return value !== 0
  }


  public readString(): string {
    const length = this.readUInt()
    const textDecoder = new TextDecoder()
    const stringData = new Uint8Array(this._dataView.buffer, this._offset, length - 1) // Exclude null terminator
    this._offset += length
    return textDecoder.decode(stringData)
  }

  public readHitCheckResult(): RpcTypes.HitCheckResult {
    const vimHandle = this.readUInt()
    const nodeIndex = this.readUInt()
    const mElementIndex = this.readUInt()

    const worldPosition = this.readVector3()
    const worldNormal = this.readVector3()

    return {
      vimHandle,
      nodeIndex,
      elementIndex: mElementIndex,
      worldPosition,
      worldNormal
    }
  }

  public readVimStatus(): RpcTypes.VimStatus {
    const status = this.readUInt()
    const progress = this.readFloat()

    return {
      status,
      progress,
    }
  }


  public readVector2(): RpcTypes.Vector2 {
    const x = this.readFloat()
    const y = this.readFloat()
    return new RpcTypes.Vector2(x, y)
  }

  public readVector3(): RpcTypes.Vector3 {
    const x = this.readFloat()
    const y = this.readFloat()
    const z = this.readFloat()
    return new RpcTypes.Vector3(x, y, z)
  }

  public readRGBA(): RpcTypes.RGBA {
    const r = this.readFloat()
    const g = this.readFloat()
    const b = this.readFloat()
    const a = this.readFloat()
    return new RpcTypes.RGBA(r, g, b, a)
  }

  public readRGB(): RpcTypes.RGB {
    const r = this.readFloat()
    const g = this.readFloat()
    const b = this.readFloat()
    return new RpcTypes.RGB(r, g, b)
  }


  public readRGBA32(): RpcTypes.RGBA32 {
    const hex = this.readUInt()
    return new RpcTypes.RGBA32(hex)
  }

  public readBox3(): RpcTypes.Box3 {
    const min = this.readVector3()
    const max = this.readVector3()

    return new RpcTypes.Box3(min, max)
  }

  public readSegment(): RpcTypes.Segment {
    const position = this.readVector3()
    const target = this.readVector3()
    return new RpcTypes.Segment(position, target)
  }

  public readSectionBoxState(): RpcTypes.SectionBoxState {
    const visible = this.readBoolean()
    const interactive = this.readBoolean()
    const clip = this.readBoolean()
    const box = this.readBox3()

    return {
      visible,
      interactive,
      clip,
      box
    }
  }

  public readArrayOfInt(): number[] {
    return this.readArray(() => this.readInt())
  }

  public readArrayOfUInt(): number[] {
    return this.readArray(() => this.readUInt())
  }

  public readArrayOfUInt64(): bigint[] {
    const length = this.readUInt();
    const array: bigint[] = [];
    for (let i = 0; i < length; i++) {
      array.push(this.readUInt64());
    }
    return array;
  }
  
  public readArrayOfFloat(): number[] {
    return this.readArray(() => this.readFloat())
  }

  public readArrayOfBool(): boolean[] {
    return this.readArray(() => this.readBoolean())
  }

  public readArrayOfRGBA32(): RpcTypes.RGBA32[] {
    return this.readArray(() => this.readRGBA32())
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