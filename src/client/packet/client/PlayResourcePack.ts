import { ResourcePack } from "./ResourcePack.ts";

/**
 * Resource Pack Response
 *
 * @see {@link https://minecraft.wiki/w/Java_Edition_protocol/Packets#Resource_Pack_Response_(play)|Resource Pack Response}
 */
export class PlayResourcePack extends ResourcePack {
  public static override readonly ID = 0x30;
}
