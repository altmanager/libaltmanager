import nbt, { type NBT } from "prismarine-nbt";
import { Buffer } from "node:buffer";
import { Packet } from "./Packet.ts";
import { VarInt } from "../VarInt.ts";
import type { State } from "../State.ts";

/**
 * Represents a S→C packet that can deserialize itself from raw bytes.
 */
export abstract class ServerPacket extends Packet {
  public static readonly STATE: State;

  private readonly buf: Uint8Array<ArrayBuffer>;
  private offset = 0;

  /**
   * @param buf Raw packet payload, with packet ID already consumed.
   */
  protected constructor(buf: Uint8Array<ArrayBuffer>) {
    super();
    this.buf = buf;
  }

  protected readVarInt(): number {
    const [value, size] = VarInt.decode(this.buf, this.offset);
    this.offset += size;
    return value;
  }

  protected readString(): string {
    const length = this.readVarInt();
    const bytes = this.buf.subarray(this.offset, this.offset + length);
    this.offset += length;
    return new TextDecoder().decode(bytes);
  }

  protected readByteArray(): Uint8Array<ArrayBuffer> {
    const length = this.readVarInt();
    const bytes = this.buf.slice(
      this.offset,
      this.offset + length,
    );
    this.offset += length;
    return bytes;
  }

  protected readLong(): bigint {
    const view = new DataView(
      this.buf.buffer,
      this.buf.byteOffset + this.offset,
      8,
    );
    this.offset += 8;
    return view.getBigInt64(0, false);
  }

  protected readBoolean(): boolean {
    return this.buf[this.offset++] !== 0;
  }

  protected readUnsignedShort(): number {
    const view = new DataView(
      this.buf.buffer,
      this.buf.byteOffset + this.offset,
      2,
    );
    this.offset += 2;
    return view.getUint16(0, false);
  }

  protected readInt(): number {
    const view = new DataView(
      this.buf.buffer,
      this.buf.byteOffset + this.offset,
      4,
    );
    this.offset += 4;
    return view.getInt32(0, false);
  }

  protected readUuid(): string {
    const hex = Array.from(this.buf.subarray(this.offset, this.offset + 16))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    this.offset += 16;
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
    ].join("-");
  }

  protected readOptional<T>(cb: () => T): T | null {
    return this.readBoolean() ? cb() : null;
  }

  protected readNbt(): NBT {
    const buffer = Buffer.from(
      this.buf.buffer,
      this.buf.byteOffset,
      this.buf.byteLength,
    );
    const { value, size } = nbt.proto.read(buffer, this.offset, "anonymousNbt");
    this.offset += size;
    return value as NBT;
  }

  protected readPrefixedArray<T>(cb: () => T): T[] {
    const length = this.readVarInt();
    const array: T[] = [];
    for (let i = 0; i < length; i++) {
      array.push(cb());
    }
    return array;
  }

  protected readRemaining(): Uint8Array<ArrayBuffer> {
    return this.buf.slice(this.offset);
  }
}
