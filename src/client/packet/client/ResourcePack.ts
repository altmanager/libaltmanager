import { ClientPacket } from "../ClientPacket.ts";

export abstract class ResourcePack extends ClientPacket {
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
  public constructor(uuid: string, result: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7) {
    super();
    this.writeUuid(uuid);
    this.writeVarInt(result);
  }
}
