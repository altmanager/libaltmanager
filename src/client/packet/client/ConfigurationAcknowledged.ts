import { ClientPacket } from "../ClientPacket.ts";

/**
 * Sent by the client upon receiving a {@link import("../server/StartConfiguration.ts").StartConfiguration} packet from
 * the server.
 *
 * @see {@link https://minecraft.wiki/w/Java_Edition_protocol/Packets#Acknowledge_Configuration|Acknowledge Configuration}
 */
export class ConfigurationAcknowledged extends ClientPacket {
  public static override readonly ID = 0x0f;

  public constructor() {
    super();
  }
}
