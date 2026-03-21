import { ClientPacket } from "../ClientPacket.ts";

/**
 * This packet causes the server to switch into the target state. It should be sent right after opening the TCP
 * connection to prevent the server from disconnecting.
 *
 * @see {@link https://minecraft.wiki/w/Java_Edition_protocol/Packets#Handshake|Handshake}
 */
export class Intention extends ClientPacket {
  public static override readonly ID = 0x00;

  /**
   * 1.21.11 protocol version.
   *
   * @see {@link https://minecraft.wiki/w/Minecraft_Wiki:Projects/wiki.vg_merge/Protocol_version_numbers|Protocol version numbers}
   */
  private static readonly PROTOCOL_VERSION = 774;

  private static readonly LOGIN_INTENT = 2;

  /**
   * @param host Server hostname.
   * @param port Server port.
   * @param intent 1 for Status, 2 for Login, 3 for Transfer. Intents 2 and 3 both transition to the Login state, but 3
   *    indicates that the client is connecting due to a Transfer packet received from another server. If the server is
   *    not expecting transfers, it may choose to reject the connection by replying with
   *    a {@link import("../server/LoginDisconnect.ts").LoginDisconnect} packet.
   */
  public constructor(
    host: string,
    port: number,
    intent: 1 | 2 | 3 = Intention.LOGIN_INTENT,
  ) {
    super();
    this.writeVarInt(Intention.PROTOCOL_VERSION);
    this.writeString(host);
    this.writeUnsignedShort(port);
    this.writeVarInt(intent);
  }
}
