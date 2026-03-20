import { VarInt } from "./VarInt.ts";

/**
 * Reads typed fields sequentially from a packet payload.
 */
export class PacketReader {
  private readonly buf: Uint8Array<ArrayBuffer>;
  private offset = 0;

  /**
   * @param buf Raw packet payload.
   */
  public constructor(buf: Uint8Array<ArrayBuffer>) {
    this.buf = buf;
  }

  public readVarInt(): number {
    const [value, size] = VarInt.decode(this.buf, this.offset);
    this.offset += size;
    return value;
  }

  public readString(): string {
    const length = this.readVarInt();
    const bytes = this.buf.subarray(this.offset, this.offset + length);
    this.offset += length;
    return new TextDecoder().decode(bytes);
  }

  public readByteArray(): Uint8Array<ArrayBuffer> {
    const length = this.readVarInt();
    const bytes = this.buf.slice(
      this.offset,
      this.offset + length,
    ) as Uint8Array<ArrayBuffer>;
    this.offset += length;
    return bytes;
  }

  public readLong(): bigint {
    const view = new DataView(
      this.buf.buffer,
      this.buf.byteOffset + this.offset,
      8,
    );
    this.offset += 8;
    return view.getBigInt64(0, false);
  }

  public readBoolean(): boolean {
    return this.buf[this.offset++] !== 0;
  }

  public readUnsignedShort(): number {
    const view = new DataView(
      this.buf.buffer,
      this.buf.byteOffset + this.offset,
      2,
    );
    this.offset += 2;
    return view.getUint16(0, false);
  }

  public readInt(): number {
    const view = new DataView(
      this.buf.buffer,
      this.buf.byteOffset + this.offset,
      4,
    );
    this.offset += 4;
    return view.getInt32(0, false);
  }

  public readUuid(): string {
    const hex = Array.from(this.buf.subarray(this.offset, this.offset + 16))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    this.offset += 16;
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${
      hex.slice(16, 20)
    }-${hex.slice(20)}`;
  }

  /**
   * Returns all remaining bytes without advancing the offset.
   */
  public readRemaining(): Uint8Array<ArrayBuffer> {
    return this.buf.slice(this.offset) as Uint8Array<ArrayBuffer>;
  }
}
