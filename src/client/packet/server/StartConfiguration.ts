import { ServerPacket } from "../ServerPacket.ts";
import { State } from "../../State.ts";

/**
 * Sent during gameplay to redo the configuration process.
 * The client must respond with {@link import("../client/ConfigurationAcknowledged.ts").ConfigurationAcknowledged} for
 * the process to start.
 *
 * @see {@link https://minecraft.wiki/w/Java_Edition_protocol/Packets#Start_Configuration|Start Configuration}}
 */
export class StartConfiguration extends ServerPacket {
  public static override readonly ID = 0x74;
  public static override readonly STATE = State.PLAY;

  public constructor(buf: Uint8Array<ArrayBuffer>) {
    super(buf);
  }
}
