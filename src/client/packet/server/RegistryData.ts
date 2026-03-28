import type { NBT } from "prismarine-nbt";
import { ServerPacket } from "../ServerPacket.ts";
import { State } from "../../State.ts";

export class RegistryData extends ServerPacket {
  public static override readonly ID = 0x07;
  public static override readonly STATE = State.CONFIGURATION;

  public readonly registryId: string;
  public readonly entries: { id: string; data: NBT | null }[];

  public constructor(buf: Uint8Array<ArrayBuffer>) {
    super(buf);
    this.registryId = this.readString();
    this.entries = this.readPrefixedArray(() => ({
      id: this.readString(),
      data: this.readPrefixedOptional(() => this.readNbt()),
    }));
  }
}
