import { KeepAlive } from "./KeepAlive.ts";
import { State } from "../../State.ts";

/**
 * The server will frequently send out a keep-alive, each containing a random ID.
 * The client must respond with the same payload.
 * If the client does not respond to a Keep Alive packet within 15 seconds after it was sent,
 * the server kicks the client. Vice versa, if the server does not send any keep-alives for 20 seconds,
 * the client will disconnect and yield a "Timed out" exception.
 * The vanilla server uses a system-dependent time in milliseconds to generate the keep alive ID value.
 *
 * @see {@link import("../client/ConfigurationKeepAlive.ts").ConfigurationKeepAlive}
 * @see {@link https://minecraft.wiki/w/Java_Edition_protocol/Packets#Clientbound_Keep_Alive_(configuration)|Clientbound Keep Alive}
 */
export class ConfigurationKeepAlive extends KeepAlive {
  public static override readonly ID = 0x04;
  public static override readonly STATE = State.CONFIGURATION;
}
