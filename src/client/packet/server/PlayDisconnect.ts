import { Disconnect } from "./Disconnect.ts";
import { State } from "../../State.ts";

/**
 * Disconnect
 *
 * @see {@link https://minecraft.wiki/w/Java_Edition_protocol/Packets#Disconnect_(play)|Disconnect}
 */
export class PlayDisconnect extends Disconnect {
  public static override readonly ID = 0x20;
  public static override readonly STATE = State.PLAY;
}
