import { ClientPacket } from "../ClientPacket.ts";

/**
 * Acknowledgement to the {@link import("../server/LoginFinished.ts").LoginFinished} packet sent by the server.
 *
 * @see {@link https://minecraft.wiki/w/Java_Edition_protocol/Packets#Login_Acknowledged|Login Acknowledged}
 */
export class LoginAcknowledged extends ClientPacket {
  public static override readonly ID = 0x03;

  public constructor() {
    super();
  }
}
