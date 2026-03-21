import { ResourcePackPush } from "./ResourcePackPush.ts";
import { State } from "../../State.ts";

/**
 * Add Resource Pack
 *
 * @see {@link https://minecraft.wiki/w/Java_Edition_protocol/Packets#Add_Resource_Pack_(play)|Add Resource Pack}
 */
export class PlayResourcePackPush extends ResourcePackPush {
  public static override readonly ID = 0x4f;
  public static override readonly STATE = State.PLAY;
}
