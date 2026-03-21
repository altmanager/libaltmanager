import { ClientPacket } from "../ClientPacket.ts";

/**
 * Encryption response.
 *
 * @see {@link https://minecraft.wiki/w/Java_Edition_protocol/Packets#Encryption_Response|Encryption Response}
 */
export class Key extends ClientPacket {
  public static override readonly ID = 0x01;

  /**
   * @param encryptedSecret RSA-encrypted shared secret.
   * @param encryptedVerifyToken RSA-encrypted verify token.
   */
  public constructor(
    encryptedSecret: Uint8Array<ArrayBuffer>,
    encryptedVerifyToken: Uint8Array<ArrayBuffer>,
  ) {
    super();
    this.writeByteArray(encryptedSecret);
    this.writeByteArray(encryptedVerifyToken);
  }
}
