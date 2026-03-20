/**
 * VarInt encoding and decoding as per the Minecraft Java Edition protocol.
 */
export class VarInt {
  private static readonly MAX_BYTES = 5;

  /**
   * Encodes a number as a VarInt.
   *
   * @param value The integer to encode.
   */
  public static encode(value: number): Uint8Array {
    const buf = new Uint8Array(VarInt.MAX_BYTES);
    let i = 0;
    do {
      let byte = value & 0x7f;
      value >>>= 7;
      if (value !== 0) byte |= 0x80;
      buf[i++] = byte;
    } while (value !== 0);
    return buf.subarray(0, i);
  }

  /**
   * Decodes a VarInt from a buffer at the given offset.
   *
   * @param buf Source buffer.
   * @param offset Byte offset to start reading from.
   * @returns The decoded value and the number of bytes read.
   */
  public static decode(buf: Uint8Array, offset: number): [number, number] {
    let value = 0;
    let shift = 0;
    let i = 0;
    while (i < VarInt.MAX_BYTES) {
      const byte = buf[offset + i++];
      value |= (byte & 0x7f) << shift;
      if ((byte & 0x80) === 0) return [value, i];
      shift += 7;
    }
    throw new Error("VarInt exceeds 5 bytes");
  }
}
