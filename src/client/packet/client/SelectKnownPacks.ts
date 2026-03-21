import { ClientPacket } from "../ClientPacket.ts";

/**
 * Informs the server of which of the data packs it knows are also present on the client.
 * The client sends this in response to {@link import("../server/SelectKnownPacks.ts").SelectKnownPacks}.
 *
 * If the client specifies a pack in this packet, the server may omit its contained NBT data (but not entry listings)
 * from the Registry Data packet.
 *
 * @see {@link https://minecraft.wiki/w/Java_Edition_protocol/Packets#Serverbound_Known_Packs|Serverbound Known Packs}
 */
export class SelectKnownPacks extends ClientPacket {
  public static override readonly ID = 0x07;

  public constructor() {
    super();
    this.writeVarInt(0);
  }
}
