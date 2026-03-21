import { ClientPacket } from "../ClientPacket.ts";

/**
 * Sent by the client to notify the server that the configuration process has finished.
 * It is sent in response to the server’s {@link import("../server/FinishConfiguration.ts").FinishConfiguration}.
 *
 * @see {@link https://minecraft.wiki/w/Java_Edition_protocol/Packets#Acknowledge_Finish_Configuration|Acknowledge Finish Configuration}
 */
export class FinishConfiguration extends ClientPacket {
  public static override readonly ID = 0x03;

  public constructor() {
    super();
  }
}
