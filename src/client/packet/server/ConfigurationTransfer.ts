import { Transfer } from "./Transfer.ts";
import { State } from "../../State.ts";

/**
 * Notifies the client that it should transfer to the given server.
 *
 * The client will close its connection to the current server, open a connection to the specified address,
 * and send a {@link import("../client/Intention.ts").Intention} with intent set to 3 (Transfer).
 * If the server chooses to accept the transfer, the usual login process will follow.
 *
 * Cookies previously stored are preserved between server transfers.
 *
 * @see {@link https://minecraft.wiki/w/Java_Edition_protocol/Packets#Transfer_(configuration)|Transfer}
 */
export class ConfigurationTransfer extends Transfer {
  public static override readonly ID = 0x0b;
  public static override readonly STATE = State.CONFIGURATION;
}
