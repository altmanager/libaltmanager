import nbt from "prismarine-nbt";
import type { Session } from "./Session.ts";
import { PlayerStatus } from "./PlayerStatus.ts";
import { TypedEventTarget } from "./TypedEventTarget.ts";
import type { PlayerEvents } from "./PlayerEvents.ts";
import { Client } from "./client/Client.ts";

/**
 * Represents a controllable Minecraft player.
 */
export class Player extends TypedEventTarget<PlayerEvents> {
  private static readonly DEFAULT_PORT = 25565;
  private static readonly CLIENT_BRAND = "vanilla";

  readonly #session: Session;
  private client: Client | null = null;
  #status: PlayerStatus = PlayerStatus.DISCONNECTED;

  /**
   * Creates a new {@link Player} with the given session.
   *
   * @param session The Microsoft session to authenticate with.
   */
  public constructor(session: Session) {
    super();
    this.#session = session;
  }

  private static simplifyComponent(tag: nbt.Tags[nbt.TagType]): unknown {
    switch (tag.type) {
      case "byte":
        return tag.value === 1 ? true : tag.value === 0 ? false : tag.value;
      case "compound":
        return Object.fromEntries(
          Object.entries(tag.value)
            .filter(([, v]) => v !== undefined)
            .map((
              [k, v],
            ) => [k === "" ? "text" : k, this.simplifyComponent(v!)]),
        );
      case "list":
        return tag.value.value.map((v: unknown) =>
          this.simplifyComponent(
            {
              type: tag.value.type,
              value: v,
            } as nbt.Tags[nbt.TagType],
          )
        );
      default:
        return tag.value;
    }
  }

  /**
   * Current connection status of the player.
   */
  public get status(): PlayerStatus {
    return this.#status;
  }

  /**
   * Connects this player to a Minecraft server.
   *
   * @param address The server address to connect to.
   */
  public connect(address: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.client !== null) {
        reject(new Error("Player is already connected"));
        return;
      }

      const portDelim = address.lastIndexOf(":");
      const host = portDelim === -1 ? address : address.substring(0, portDelim);
      const port = portDelim === -1
        ? Player.DEFAULT_PORT
        : Number.parseInt(address.substring(portDelim + 1));

      const client = new Client(this.#session, Player.CLIENT_BRAND);
      this.client = client;

      client.addEventListener("login", () => {
        this.#status = PlayerStatus.ONLINE;
        this.dispatchEvent("statusChange", void 0);
        resolve();
      }, { once: true });

      client.addEventListener("disconnect", () => {
        this.#status = PlayerStatus.DISCONNECTED;
        this.client = null;
        this.dispatchEvent("statusChange", void 0);
        reject(new Error("Disconnected before login"));
      }, { once: true });

      client.addEventListener("chat", (message) => {
        this.dispatchEvent("chat", Player.simplifyComponent(message.detail));
      });

      client.addEventListener("kick", (reason) => {
        this.dispatchEvent(
          "kick",
          typeof reason.detail === "string"
            ? JSON.parse(reason.detail)
            : Player.simplifyComponent(reason.detail),
        );
      });

      this.#status = PlayerStatus.CONNECTING;
      this.dispatchEvent("statusChange", void 0);

      client.connect(host, port).catch((e) => {
        this.#status = PlayerStatus.DISCONNECTED;
        this.dispatchEvent("statusChange", void 0);
        this.client = null;
        reject(e);
      });
    });
  }

  /**
   * Disconnects this player from the current server.
   */
  public disconnect(): void {
    if (this.client === null) {
      throw new Error("Player is not connected");
    }
    this.client.disconnect();
    this.client = null;
  }

  /**
   * Sends an unsigned chat message.
   *
   * @param message Message to send.
   */
  public async chat(message: string): Promise<void> {
    if (this.client === null) {
      throw new Error("Player is not connected");
    }
    return await this.client.chat(message);
  }
}
