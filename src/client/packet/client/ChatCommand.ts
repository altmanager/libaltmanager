import { ClientPacket } from "../ClientPacket.ts";

/**
 * Chat Command
 *
 * @see {@link https://minecraft.wiki/w/Java_Edition_protocol/Packets#Chat_Command|Chat Command}
 */
export class ChatCommand extends ClientPacket {
  public static override readonly ID = 0x06;

  /**
   * Constructs packet.
   *
   * @param command Command typed by the client excluding the `/`.
   */
  public constructor(command: string) {
    super();
    this.writeString(command);
  }
}
