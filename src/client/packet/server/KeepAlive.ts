import { ServerPacket } from "../ServerPacket.ts";

export abstract class KeepAlive extends ServerPacket {
  public readonly id: bigint;

  public constructor(buf: Uint8Array<ArrayBuffer>) {
    super(buf);
    this.id = this.readLong();
  }
}
