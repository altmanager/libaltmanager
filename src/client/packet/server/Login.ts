import { ServerPacket } from "../ServerPacket.ts";
import { State } from "../../State.ts";

/**
 * Login
 *
 * @see {@link https://minecraft.wiki/w/Protocol_encryption|Protocol encryption}
 * @see {@link https://minecraft.wiki/w/Java_Edition_protocol/Packets#Login_(play)|Login}
 */
export class Login extends ServerPacket {
  public static override readonly ID = 0x30;
  public static override readonly STATE = State.PLAY;

  public constructor(buf: Uint8Array<ArrayBuffer>) {
    super(buf);
  }
}
