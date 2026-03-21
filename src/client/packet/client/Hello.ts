import { ClientPacket } from "../ClientPacket.ts";

/**
 * Login start.
 *
 * @see {@link https://minecraft.wiki/w/Java_Edition_protocol/Packets#Login_Start|Login Start}
 */
export class Hello extends ClientPacket {
  public static override readonly ID = 0x00;

  /**
   * @param username Player username.
   * @param uuid Player UUID.
   */
  public constructor(username: string, uuid: string) {
    super();
    this.writeString(username);
    this.writeUuid(uuid);
  }
}
