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
  public static encode(value: number): Uint8Array<ArrayBuffer> {
    const buf = new Uint8Array(VarInt.MAX_BYTES);
    let i = 0;
    do {
      let byte = value & 0x7f;
      value >>>= 7;
      if (value !== 0) {
        byte |= 0x80;
      }
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
    let bytesRead = 0;
    const gen = VarInt.decodeGen();
    gen.next();
    while (true) {
      const { value, done } = gen.next(buf[offset + bytesRead++]);
      if (done) {
        return [value, bytesRead];
      }
    }
  }

  /**
   * Reads a VarInt from an async byte source.
   *
   * @param readByte Function that returns the next byte, or `null` on end of input.
   * @returns The decoded value, or `null` if the source ended before the first byte.
   */
  public static async read(
    readByte: () => Promise<number | null>,
  ): Promise<number | null> {
    const gen = VarInt.decodeGen();
    gen.next();
    let byte = await readByte();
    if (byte === null) {
      return null;
    }
    do {
      const { value, done } = gen.next(byte);
      if (done) {
        return value;
      }
      byte = await readByte();
      if (byte === null) {
        throw new Error("Unexpected end of input");
      }
    } while (true);
  }

  private static *decodeGen(): Generator<void, number, number> {
    let value = 0;
    let shift = 0;
    for (let i = 0; i < VarInt.MAX_BYTES; i++) {
      const byte: number = yield;
      value |= (byte & 0x7f) << shift;
      if ((byte & 0x80) === 0) {
        return value;
      }
      shift += 7;
    }
    throw new Error("VarInt exceeds 5 bytes");
  }
}
