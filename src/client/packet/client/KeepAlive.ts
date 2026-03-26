import { ClientPacket } from "../ClientPacket.ts";

export abstract class KeepAlive extends ClientPacket {
  /**
   * @param id Keep-alive ID echoed from the server.
   */
  public constructor(id: bigint) {
    super();
    this.writeLong(id);
  }
}
