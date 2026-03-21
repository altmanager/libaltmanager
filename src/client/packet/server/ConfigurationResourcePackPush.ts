import { ResourcePackPush } from "./ResourcePackPush.ts";
import { State } from "../../State.ts";

/**
 * Add Resource Pack
 *
 * @see {@link https://minecraft.wiki/w/Java_Edition_protocol/Packets#Add_Resource_Pack_(configuration)|Add Resource Pack}
 */
export class ConfigurationResourcePackPush extends ResourcePackPush {
  public static override readonly ID = 0x09;
  public static override readonly STATE = State.CONFIGURATION;
}
