import { ServerPacket } from "../ServerPacket.ts";

export abstract class ResourcePackPush extends ServerPacket {
  /**
   * The unique identifier of the resource pack.
   */
  public readonly uuid: string;

  /**
   * The URL to the resource pack.
   */
  public readonly url: string;

  /**
   * A 40 character hexadecimal, case-insensitive SHA-1 hash of the resource pack file.
   * If it's not a 40-character hexadecimal string,
   * the client will not use it for hash verification and likely waste bandwidth.
   */
  public readonly hash: string;

  /**
   * The vanilla client will be forced to use the resource pack from the server.
   * If they decline, they will be kicked from the server.
   */
  public readonly forced: boolean;

  /**
   * This is shown in the prompt making the client accept or decline the resource pack (only if present).
   */
  public readonly prompt: string | null;

  public constructor(buf: Uint8Array<ArrayBuffer>) {
    super(buf);
    this.uuid = this.readUuid();
    this.url = this.readString();
    this.hash = this.readString();
    this.forced = this.readBoolean();
    this.prompt = this.readOptional(() => this.readString());
  }
}
