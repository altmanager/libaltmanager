import { ServerPacket } from "../ServerPacket.ts";
import { State } from "../../State.ts";

/**
 * Sent by the server to remove players from the client's player list.
 *
 * @see {@link https://minecraft.wiki/w/Java_Edition_protocol/Packets#Player_Info_Remove|Player Info Remove}
 */
export class PlayerInfoRemove extends ServerPacket {
  public static override readonly ID = 0x43;
  public static override readonly STATE = State.PLAY;

  /**
   * UUIDs of players to remove.
   */
  public readonly uuids: string[];

  public constructor(buf: Uint8Array<ArrayBuffer>) {
    super(buf);
    this.uuids = this.readPrefixedArray(this.readUuid);
  }
}
