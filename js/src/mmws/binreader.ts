export default class BinReader {
  private data: DataView
  private cursor: number

  constructor(data: ArrayBuffer) {
    this.data = new DataView(data)
    this.cursor = 0
  }

  seek(offset: number): void {
    this.cursor = offset
  }

  readUInt32LE(): number {
    const value = this.data.getUint32(this.cursor, true)
    this.cursor += 4
    return value
  }

  readInt32LE(): number {
    const value = this.data.getInt32(this.cursor, true)
    this.cursor += 4
    return value
  }

  readInt16LE(): number {
    const value = this.data.getInt16(this.cursor, true)
    this.cursor += 2
    return value
  }

  readFloatLE(): number {
    const value = this.data.getFloat32(this.cursor, true)
    this.cursor += 4
    return value
  }

  readString(): string {
    const buffer = []
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const charCode = this.data.getUint8(this.cursor)
      this.cursor += 1
      if (charCode === 0) {
        break
      }
      buffer.push(charCode)
    }
    return String.fromCharCode(...buffer)
  }
}
