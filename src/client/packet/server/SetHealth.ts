import { ServerPacket } from "../ServerPacket.ts";
import { State } from "../../State.ts";

/**
 * Sent by the server to set the health of the player it is sent to.
 *
 * @see {@link https://minecraft.wiki/w/Java_Edition_protocol/Packets#Set_Health|Set Health}
 */
export class SetHealth extends ServerPacket {
  public static override readonly ID = 0x66;
  public static override readonly STATE = State.PLAY;

  /**
   * 0 or less = dead, 20 = full HP.
   */
  public readonly health: number;
  /**
   * 0–20 (integer)
   */
  public readonly food: number;
  /**
   * Seems to vary from 0.0 to 5.0 in integer increments.
   */
  public readonly foodSaturation: number;

  public constructor(buf: Uint8Array<ArrayBuffer>) {
    super(buf);
    this.health = this.readFloat();
    this.food = this.readVarInt();
    this.foodSaturation = this.readFloat();
  }
}
