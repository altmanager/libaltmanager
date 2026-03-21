import { ClientPacket } from "../ClientPacket.ts";

/**
 * Resource Pack Response
 *
 * @see {@link https://minecraft.wiki/w/Java_Edition_protocol/Packets#Resource_Pack_Response_(play)|Resource Pack Response}
 */
export class PlayResourcePack extends ClientPacket {
  public static override readonly ID = 0x30;

  /**
   * Constructs packet.
   *
   * @param uuid Resource pack UUID.
   * @param result Response result.
   *    - `0` Successfully downloaded
   *    - `1` Declined
   *    - `2` Failed to download
   *    - `3` Accepted
   *    - `4` Downloaded
   *    - `5` Invalid URL
   *    - `6` Failed to reload
   *    - `7` Discarded
   */
  public constructor(uuid: string, result: number) {
    super();
    this.writeUuid(uuid);
    this.writeVarInt(result);
  }
}
