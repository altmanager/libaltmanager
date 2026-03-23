import type { NBT } from "prismarine-nbt";
import { ServerPacket } from "../ServerPacket.ts";
import { State } from "../../State.ts";

export class DisguisedChat extends ServerPacket {
  public static override readonly ID = 0x21;
  public static override readonly STATE = State.PLAY;

  public readonly message: NBT;
  public readonly chatType: NBT | number;
  public readonly senderName: NBT;
  public readonly targetName: NBT | null;

  public constructor(buf: Uint8Array<ArrayBuffer>) {
    super(buf);
    this.message = this.readNbt();
    this.chatType = this.readIdOr(() => this.readNbt());
    this.senderName = this.readNbt();
    this.targetName = this.readOptional(() => this.readNbt());
  }
}
