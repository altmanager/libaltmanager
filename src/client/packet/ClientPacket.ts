import { Packet } from "./Packet.ts";
import { VarInt } from "../VarInt.ts";

/**
 * Represents a C→S packet that can serialize itself.
 */
export abstract class ClientPacket extends Packet {
  private chunks: Uint8Array<ArrayBuffer>[] = [];

  protected constructor() {
    super();
    this.writeVarInt((this.constructor as typeof ClientPacket).ID);
  }

  public serialize(): Uint8Array<ArrayBuffer> {
    const total = this.chunks.reduce((n, c) => n + c.length, 0);
    const out = new Uint8Array(new ArrayBuffer(total));
    let offset = 0;
    for (const chunk of this.chunks) {
      out.set(chunk, offset);
      offset += chunk.length;
    }
    return out;
  }

  protected writeVarInt(value: number): void {
    this.chunks.push(VarInt.encode(value));
  }

  protected writeString(value: string): void {
    const bytes = new TextEncoder().encode(value);
    this.writeVarInt(bytes.length);
    this.chunks.push(bytes);
  }

  protected writeByteArray(value: Uint8Array<ArrayBuffer>): void {
    this.writeVarInt(value.length);
    this.chunks.push(value);
  }

  protected writeLong(value: bigint): void {
    const buf = new ArrayBuffer(8);
    new DataView(buf).setBigInt64(0, value, false);
    this.chunks.push(new Uint8Array(buf));
  }

  protected writeBoolean(value: boolean): void {
    this.chunks.push(
      new Uint8Array([value ? 1 : 0]),
    );
  }

  protected writeByte(value: number): void {
    this.chunks.push(new Uint8Array([value & 0xff]));
  }

  protected writeUnsignedShort(value: number): void {
    const buf = new ArrayBuffer(2);
    new DataView(buf).setUint16(0, value, false);
    this.chunks.push(new Uint8Array(buf));
  }

  protected writeInt(value: number): void {
    const buf = new ArrayBuffer(4);
    new DataView(buf).setInt32(0, value, false);
    this.chunks.push(new Uint8Array(buf));
  }

  protected writeUuid(uuid: string): void {
    const hex = uuid.replaceAll("-", "");
    const buf = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      buf[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    this.chunks.push(buf);
  }

  protected writeOptional<T>(value: T | null, cb: (value: T) => void): void {
    if (value === null) {
      this.writeBoolean(false);
    } else {
      this.writeBoolean(true);
      cb(value);
    }
  }

  protected writeFixedBitSet(bits: bigint, n: number): void {
    const buf = new Uint8Array(Math.ceil(n / 8));
    for (let i = 0; i < n; i++) {
      if (((bits >> BigInt(i)) & 1n) !== 0n) {
        buf[Math.floor(i / 8)] |= (1 << (i % 8));
      }
    }
    this.chunks.push(buf);
  }
}
