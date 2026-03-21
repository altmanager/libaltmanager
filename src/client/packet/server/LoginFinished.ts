import { ServerPacket } from "../ServerPacket.ts";
import { State } from "../../State.ts";

/**
 * Login Success
 *
 * @see {@link https://minecraft.wiki/w/Java_Edition_protocol/Packets#Login_Success|Login Success}}
 */
export class LoginFinished extends ServerPacket {
  public static override readonly ID = 0x02;
  public static override readonly STATE = State.LOGIN;

  public constructor(buf: Uint8Array<ArrayBuffer>) {
    super(buf);
  }
}
