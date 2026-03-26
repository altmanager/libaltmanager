import { ClientPacket } from "../ClientPacket.ts";

/**
 * Client Status
 *
 * @see {@link https://minecraft.wiki/w/Java_Edition_protocol/Packets#Client_Status|Client Status}
 */
export class ClientCommand extends ClientPacket {
  public static override readonly ID = 0x0B;

  /**
   * Perform respawn.
   */
  public static readonly RESPAWN = 0;

  /**
   * Request statistics.
   */
  public static readonly STATS = 1;

  /**
   * Constructs packet.
   *
   * @param action Action to perform, see {@link RESPAWN} and {@link STATS}.
   */
  public constructor(
    action: typeof ClientCommand.RESPAWN | typeof ClientCommand.STATS,
  ) {
    super();
    this.writeVarInt(action);
  }
}
