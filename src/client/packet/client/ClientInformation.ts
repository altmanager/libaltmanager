import { ClientPacket } from "../ClientPacket.ts";

/**
 * Sent when the player connects, or when settings are changed.
 *
 * @see {@link https://minecraft.wiki/w/Java_Edition_protocol/Packets#Client_Information_(configuration)|Client Information}
 */
export class ClientInformation extends ClientPacket {
  public static override readonly ID = 0x00;

  private static readonly LOCALE = "en_GB";
  private static readonly VIEW_DISTANCE = 2;
  private static readonly CHAT_MODE = 0;
  private static readonly CHAT_COLORS = true;
  private static readonly SKIN_PARTS = 0x7f;
  private static readonly MAIN_HAND = 1;
  private static readonly ENABLE_TEXT_FILTERING = false;
  private static readonly ALLOW_SERVER_LISTINGS = true;
  private static readonly PARTICLE_STATUS = 2;

  public constructor(
    options?: Partial<{
      locale: string;
      viewDistance: number;
      chatMode: 0 | 1 | 2;
      chatColors: boolean;
      skinParts: number;
      mainHand: 0 | 1;
      enableTextFiltering: boolean;
      allowServerListings: boolean;
      particleStatus: 0 | 1 | 2;
    }>,
  ) {
    super();
    this.writeString(options?.locale ?? ClientInformation.LOCALE);
    this.writeByte(options?.viewDistance ?? ClientInformation.VIEW_DISTANCE);
    this.writeVarInt(options?.chatMode ?? ClientInformation.CHAT_MODE);
    this.writeBoolean(options?.chatColors ?? ClientInformation.CHAT_COLORS);
    this.writeByte(options?.skinParts ?? ClientInformation.SKIN_PARTS);
    this.writeVarInt(options?.mainHand ?? ClientInformation.MAIN_HAND);
    this.writeBoolean(
      options?.enableTextFiltering ?? ClientInformation.ENABLE_TEXT_FILTERING,
    );
    this.writeBoolean(
      options?.allowServerListings ?? ClientInformation.ALLOW_SERVER_LISTINGS,
    );
    this.writeVarInt(
      options?.particleStatus ?? ClientInformation.PARTICLE_STATUS,
    );
  }
}
