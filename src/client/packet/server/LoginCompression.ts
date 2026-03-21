import { ServerPacket } from "../ServerPacket.ts";
import { State } from "../../State.ts";

/**
 * Enables compression. If compression is enabled, all following packets are encoded in the compressed packet format.
 * Negative values will disable compression, meaning the packet format should remain in the uncompressed packet format.
 * However, this packet is entirely optional, and if not sent, compression will also not be enabled (the vanilla server
 * does not send the packet when compression is disabled).
 *
 * @see {@link https://minecraft.wiki/w/Java_Edition_protocol/Packets#Set_Compression|Set Compression}
 */
export class LoginCompression extends ServerPacket {
  public static override readonly ID = 0x03;
  public static override readonly STATE = State.LOGIN;

  /**
   * Maximum size of a packet before it is compressed.
   */
  public readonly threshold: number;

  public constructor(buf: Uint8Array<ArrayBuffer>) {
    super(buf);
    this.threshold = this.readVarInt();
  }
}
