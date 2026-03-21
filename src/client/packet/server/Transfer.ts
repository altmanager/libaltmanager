import { ServerPacket } from "../ServerPacket.ts";

export abstract class Transfer extends ServerPacket {
  /**
   * The hostname or IP of the server.
   */
  public readonly host: string;

  /**
   * The port of the server.
   */
  public readonly port: number;

  public constructor(buf: Uint8Array<ArrayBuffer>) {
    super(buf);
    this.host = this.readString();
    this.port = this.readVarInt();
  }
}
