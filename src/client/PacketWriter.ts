import { VarInt } from "./VarInt.ts";

/**
 * Builds a packet payload by appending typed fields.
 */
export class PacketWriter {
  private chunks: Uint8Array<ArrayBuffer>[] = [];

  public writeVarInt(value: number): this {
    this.chunks.push(VarInt.encode(value) as Uint8Array<ArrayBuffer>);
    return this;
  }

  public writeString(value: string): this {
    const bytes = new TextEncoder().encode(value) as Uint8Array<ArrayBuffer>;
    this.writeVarInt(bytes.length);
    this.chunks.push(bytes);
    return this;
  }

  public writeByteArray(value: Uint8Array<ArrayBuffer>): this {
    this.writeVarInt(value.length);
    this.chunks.push(value);
    return this;
  }

  public writeLong(value: bigint): this {
    const buf = new ArrayBuffer(8);
    new DataView(buf).setBigInt64(0, value, false);
    this.chunks.push(new Uint8Array(buf));
    return this;
  }

  public writeBoolean(value: boolean): this {
    this.chunks.push(
      new Uint8Array([value ? 1 : 0]) as Uint8Array<ArrayBuffer>,
    );
    return this;
  }

  public writeUnsignedShort(value: number): this {
    const buf = new ArrayBuffer(2);
    new DataView(buf).setUint16(0, value, false);
    this.chunks.push(new Uint8Array(buf));
    return this;
  }

  public writeInt(value: number): this {
    const buf = new ArrayBuffer(4);
    new DataView(buf).setInt32(0, value, false);
    this.chunks.push(new Uint8Array(buf));
    return this;
  }

  public writeUuid(uuid: string): this {
    const hex = uuid.replaceAll("-", "");
    const buf = new Uint8Array(16) as Uint8Array<ArrayBuffer>;
    for (let i = 0; i < 16; i++) {
      buf[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    this.chunks.push(buf);
    return this;
  }

  public writeByte(value: number): this {
    this.chunks.push(new Uint8Array([value & 0xff]) as Uint8Array<ArrayBuffer>);
    return this;
  }

  /**
   * Returns the assembled packet payload.
   */
  public build(): Uint8Array<ArrayBuffer> {
    const total = this.chunks.reduce((n, c) => n + c.length, 0);
    const out = new Uint8Array(new ArrayBuffer(total));
    let offset = 0;
    for (const chunk of this.chunks) {
      out.set(chunk, offset);
      offset += chunk.length;
    }
    return out;
  }
}
