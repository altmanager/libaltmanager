import { ServerPacket } from "../ServerPacket.ts";
import { State } from "../../State.ts";

/**
 * Disconnect
 *
 * @see {@link https://minecraft.wiki/w/Java_Edition_protocol/Packets#Disconnect_(login)|Disconnect}
 */
export class LoginDisconnect extends ServerPacket {
  public static override readonly ID = 0x00;
  public static override readonly STATE = State.LOGIN;

  /**
   * The reason why the player was disconnected as a JSON text component.
   */
  public readonly reason: string;

  public constructor(buf: Uint8Array<ArrayBuffer>) {
    super(buf);
    this.reason = this.readString();
  }
}
