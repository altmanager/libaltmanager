import type { NBT } from "prismarine-nbt";
import { State } from "../../State.ts";
import { ServerPacket } from "../ServerPacket.ts";

/**
 * Disconnect
 *
 * @see {@link https://minecraft.wiki/w/Java_Edition_protocol/Packets#Disconnect_(play)|Disconnect}
 */
export class PlayDisconnect extends ServerPacket {
  public static override readonly ID = 0x20;
  public static override readonly STATE = State.PLAY;

  public readonly reason: NBT;

  public constructor(buf: Uint8Array<ArrayBuffer>) {
    super(buf);
    this.reason = this.readNbt();
  }
}
