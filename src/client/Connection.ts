import aesjs from "aes-js";
import { deflateRawSync, inflateSync } from "node:zlib";
import { VarInt } from "./VarInt.ts";

/**
 * Represents a TCP connection with Minecraft Java Edition packet framing.
 */
export class Connection {
  private conn: Deno.TcpConn | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private encryptCfb: InstanceType<typeof aesjs.ModeOfOperation.cfb> | null =
    null;
  private decryptCfb: InstanceType<typeof aesjs.ModeOfOperation.cfb> | null =
    null;
  private compressionThreshold = -1;
  private buf: Uint8Array = new Uint8Array(0);

  /**
   * Opens a TCP connection to the given host and port.
   *
   * @param host Hostname or IP address.
   * @param port TCP port.
   */
  public async connect(host: string, port: number): Promise<void> {
    this.conn = await Deno.connect({ hostname: host, port, transport: "tcp" });
    this.reader = this.conn.readable.getReader();
  }

  /**
   * Closes the connection. Safe to call multiple times.
   */
  public close(): void {
    if (this.conn === null) return;
    try {
      this.reader?.cancel();
      this.conn.close();
    } catch {
      // ignore
    } finally {
      this.conn = null;
      this.reader = null;
      this.encryptCfb = null;
      this.decryptCfb = null;
      this.compressionThreshold = -1;
      this.buf = new Uint8Array(0);
    }
  }

  /**
   * Enables AES-128-CFB8 encryption.
   *
   * @param sharedSecret 16-byte shared secret.
   */
  public enableEncryption(sharedSecret: Uint8Array<ArrayBuffer>): void {
    this.encryptCfb = new aesjs.ModeOfOperation.cfb(
      sharedSecret,
      sharedSecret,
      1,
    );
    this.decryptCfb = new aesjs.ModeOfOperation.cfb(
      sharedSecret,
      sharedSecret,
      1,
    );
  }

  /**
   * @param threshold Minimum uncompressed byte length before compression applies. -1 disables compression.
   */
  public setCompressionThreshold(threshold: number): void {
    this.compressionThreshold = threshold;
  }

  /**
   * Reads the next complete packet payload (packet ID + fields).
   * Returns `null` on clean remote close.
   */
  public async readPacket(): Promise<Uint8Array<ArrayBuffer> | null> {
    const packetLength = await this.readVarInt();
    if (packetLength === null) return null;

    const raw = await this.readExact(packetLength);
    if (raw === null) return null;

    if (this.compressionThreshold < 0) {
      return raw;
    }

    const [dataLength, varIntSize] = VarInt.decode(raw, 0);

    if (dataLength === 0) {
      return raw.subarray(varIntSize);
    }

    const decompressed = Connection.decompress(raw.subarray(varIntSize));

    if (decompressed.length !== dataLength) {
      throw new Error(
        `Decompressed length mismatch: expected ${dataLength}, got ${decompressed.length}`,
      );
    }

    return decompressed;
  }

  /**
   * Writes a packet payload, applying compression and encryption as configured.
   *
   * @param payload Packet ID VarInt followed by field bytes.
   */
  public async writePacket(payload: Uint8Array<ArrayBuffer>): Promise<void> {
    let framed: Uint8Array<ArrayBuffer>;

    if (this.compressionThreshold < 0) {
      framed = Connection.concat(VarInt.encode(payload.length), payload);
    } else if (payload.length >= this.compressionThreshold) {
      const compressed = Connection.compress(payload);
      const body = Connection.concat(VarInt.encode(payload.length), compressed);
      framed = Connection.concat(VarInt.encode(body.length), body);
    } else {
      const body = Connection.concat(VarInt.encode(0), payload);
      framed = Connection.concat(VarInt.encode(body.length), body);
    }

    if (this.encryptCfb !== null) {
      framed = this.encryptCfb.encrypt(framed) as Uint8Array<ArrayBuffer>;
    }

    await this.writeAll(framed);
  }

  private async readVarInt(): Promise<number | null> {
    let value = 0;
    let shift = 0;

    for (let i = 0; i < 5; i++) {
      const byte = await this.readOneByte();
      if (byte === null) {
        if (i === 0) return null;
        throw new Error("Connection closed mid-VarInt");
      }
      value |= (byte & 0x7f) << shift;
      if ((byte & 0x80) === 0) return value;
      shift += 7;
    }

    throw new Error("VarInt exceeds 5 bytes");
  }

  private async readExact(
    length: number,
  ): Promise<Uint8Array<ArrayBuffer> | null> {
    const out = new Uint8Array(length);
    let pos = 0;

    while (pos < length) {
      if (this.buf.length > 0) {
        const take = Math.min(this.buf.length, length - pos);
        out.set(this.buf.subarray(0, take), pos);
        this.buf = this.buf.subarray(take);
        pos += take;
        continue;
      }

      const chunk = await this.readChunk();
      if (chunk === null) {
        if (pos === 0) return null;
        throw new Error("Connection closed mid-packet");
      }
      this.buf = chunk;
    }

    return out;
  }

  private async readOneByte(): Promise<number | null> {
    if (this.buf.length > 0) {
      const b = this.buf[0];
      this.buf = this.buf.subarray(1);
      return b;
    }

    const chunk = await this.readChunk();
    if (chunk === null) return null;

    const b = chunk[0];
    this.buf = chunk.subarray(1);
    return b;
  }

  private async readChunk(): Promise<Uint8Array | null> {
    if (this.reader === null) throw new Error("Not connected");

    const { value, done } = await this.reader.read();
    if (done || value === undefined) return null;

    const chunk = value.byteOffset !== 0 ? new Uint8Array(value) : value;

    if (this.decryptCfb !== null) {
      return this.decryptCfb.decrypt(chunk);
    }

    return chunk;
  }

  private async writeAll(data: Uint8Array<ArrayBuffer>): Promise<void> {
    if (this.conn === null) throw new Error("Not connected");

    let offset = 0;
    while (offset < data.length) {
      offset += await this.conn.write(data.subarray(offset));
    }
  }

  private static decompress(
    data: Uint8Array<ArrayBuffer>,
  ): Uint8Array<ArrayBuffer> {
    return inflateSync(data) as Uint8Array<ArrayBuffer>;
  }

  private static compress(
    data: Uint8Array<ArrayBuffer>,
  ): Uint8Array<ArrayBuffer> {
    return deflateRawSync(data) as Uint8Array<ArrayBuffer>;
  }

  private static concat(
    a: Uint8Array,
    b: Uint8Array<ArrayBuffer>,
  ): Uint8Array<ArrayBuffer> {
    const out = new Uint8Array(a.length + b.length);
    out.set(a);
    out.set(b, a.length);
    return out;
  }
}
