import type { Session } from "./Session.ts";
import { type Bot, createBot } from "mineflayer";
import { PlayerStatus } from "./PlayerStatus.ts";
import { TypedEventTarget } from "./TypedEventTarget.ts";
import type { PlayerEvents } from "./PlayerEvents.ts";

/**
 * Represents a controllable Minecraft player.
 */
export class Player extends TypedEventTarget<PlayerEvents> {
  private static readonly MINECRAFT_VERSION = "1.21.11";
  private static readonly DEFAULT_PORT = 25565;
  private static readonly CLIENT_BRAND = "vanilla";

  readonly #session: Session;
  #bot: Bot | null = null;
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
      if (this.#bot !== null) {
        reject(new Error("Player is already connected"));
        return;
      }

      const portDelim = address.lastIndexOf(":");
      const host = portDelim === -1 ? address : address.substring(0, portDelim);
      const port = portDelim === -1
        ? Player.DEFAULT_PORT
        : Number.parseInt(address.substring(portDelim + 1));

      this.#bot = createBot({
        host,
        port,
        username: this.#session.username,
        skipValidation: true,
        auth: (client, options) => {
          // @ts-expect-error: this property is vital but not exposed in typings
          options.haveCredentials = true;

          client.username = this.#session.username;
          client.session = {
            accessToken: this.#session.token,
            selectedProfile: {
              id: this.#session.uuid.replace(/-/g, ""),
              name: this.#session.username,
            },
          };
          options.accessToken = this.#session.token;
          options.connect!(client);
        },
        version: Player.MINECRAFT_VERSION,
        brand: Player.CLIENT_BRAND,
        hideErrors: true,
        logErrors: false,
      });

      this.#status = PlayerStatus.CONNECTING;
      this.dispatchEvent("statusChange", void 0);

      this.addEventListener("statusChange", () => {
        if (this.#status !== PlayerStatus.ONLINE) {
          reject(new Error("Failed to connect"));
          return;
        }
        resolve();
      }, { once: true });

      this.registerEvents();
    });
  }

  /**
   * Disconnects this player from the current server.
   */
  public disconnect(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.#bot === null) {
        reject(new Error("Player is not connected"));
        return;
      }

      this.#bot.quit();

      this.addEventListener("statusChange", () => {
        if (this.#status !== PlayerStatus.DISCONNECTED) {
          reject(new Error("Failed to disconnect"));
          return;
        }
        resolve();
      }, { once: true });
    });
  }

  private registerEvents() {
    if (this.#bot === null) {
      throw new Error("Player is not connected");
    }

    this.#bot.once("spawn", () => {
      this.#status = PlayerStatus.ONLINE;
      this.dispatchEvent("statusChange", void 0);
    });

    this.#bot.once("end", () => {
      this.#status = PlayerStatus.DISCONNECTED;
      this.dispatchEvent("statusChange", void 0);

      this.#bot = null;
    });

    this.#bot.on("resourcePack", () => {
      this.#bot!.acceptResourcePack();
    });
  }
}
