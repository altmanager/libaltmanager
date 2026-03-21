import { ServerPacket } from "../ServerPacket.ts";

export abstract class Disconnect extends ServerPacket {
  /**
   * The reason why the player was disconnected as a JSON text component.
   */
  public readonly reason: string;

  public constructor(buf: Uint8Array<ArrayBuffer>) {
    super(buf);
    this.reason = this.readString();
  }
}
