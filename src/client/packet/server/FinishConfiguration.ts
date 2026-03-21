import { ServerPacket } from "../ServerPacket.ts";
import { State } from "../../State.ts";

/**
 * This packet switches the connection state to {@link State.PLAY}.
 *
 * @see {@link https://minecraft.wiki/w/Java_Edition_protocol/Packets#Finish_Configuration|Finish Configuration}
 */
export class FinishConfiguration extends ServerPacket {
  public static override readonly ID = 0x03;
  public static override readonly STATE = State.CONFIGURATION;

  public constructor(buf: Uint8Array<ArrayBuffer>) {
    super(buf);
  }
}
