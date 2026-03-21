import { ServerPacket } from "../ServerPacket.ts";
import { State } from "../../State.ts";

/**
 * Informs the client of which data packs are present on the server.
 * The client is expected to respond with its own {@link import("../client/SelectKnownPacks.ts").SelectKnownPacks}
 * packet containing the subset of packs also known to the client,
 * in the same order as they were listed by the server.
 * The vanilla server does not continue with Configuration until it receives a response.
 *
 * @see {@link https://minecraft.wiki/w/Java_Edition_protocol/Packets#Clientbound_Known_Packs|Clientbound Known Packs}
 */
export class SelectKnownPacks extends ServerPacket {
  public static override readonly ID = 0x0e;
  public static override readonly STATE = State.CONFIGURATION;

  public constructor(buf: Uint8Array<ArrayBuffer>) {
    super(buf);
  }
}
