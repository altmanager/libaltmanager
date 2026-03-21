import { Disconnect } from "./Disconnect.ts";
import { State } from "../../State.ts";

/**
 * Disconnect
 *
 * @see {@link https://minecraft.wiki/w/Java_Edition_protocol/Packets#Disconnect_(configuration)|Disconnect}}
 */
export class ConfigurationDisconnect extends Disconnect {
  public static override readonly ID = 0x02;
  public static override readonly STATE = State.CONFIGURATION;
}
