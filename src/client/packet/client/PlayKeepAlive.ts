import { ClientPacket } from "../ClientPacket.ts";

/**
 * The server will frequently send out a keep-alive, each containing a random ID.
 * The client must respond with the same packet.
 *
 * @see {@link import("../server/PlayKeepAlive.ts").PlayKeepAlive}
 * @see {@link https://minecraft.wiki/w/Java_Edition_protocol/Packets#Serverbound_Keep_Alive_(play)|Serverbound Keep Alive}
 */
export class PlayKeepAlive extends ClientPacket {
  public static override readonly ID = 0x1b;

  /**
   * @param id Keep-alive ID echoed from the server.
   */
  public constructor(id: bigint) {
    super();
    this.writeLong(id);
  }
}
