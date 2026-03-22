import type { NBT } from "prismarine-nbt";
import { ServerPacket } from "../ServerPacket.ts";
import { State } from "../../State.ts";

export class SystemChat extends ServerPacket {
  public static override readonly ID = 0x77;
  public static override readonly STATE = State.PLAY;

  public readonly content: NBT;
  public readonly overlay: boolean;

  public constructor(buf: Uint8Array<ArrayBuffer>) {
    super(buf);
    this.content = this.readNbt();
    this.overlay = this.readBoolean();
  }
}
