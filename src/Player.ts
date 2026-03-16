import type { Session } from "./Session.ts";
import { type Bot, createBot } from "mineflayer";
import { PlayerStatus } from "./PlayerStatus.ts";
import { TypedEventTarget } from "./TypedEventTarget.ts";
import { PlayerEvents } from "./PlayerEvents.ts";

export class Player extends TypedEventTarget<PlayerEvents> {
  private static readonly MINECRAFT_VERSION = "1.21.11";
  private static readonly DEFAULT_PORT = 25565;
  private static readonly CLIENT_BRAND = "vanilla";

  readonly #session: Session;
  #bot: Bot | null = null;
  #status: PlayerStatus = PlayerStatus.DISCONNECTED;

  public constructor(session: Session) {
    super();
    this.#session = session;
  }

  public get status() {
    return this.#status;
  }

  public connect(address: string) {
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
        auth: "offline",
        session: {
          accessToken: this.#session.token,
          selectedProfile: {
            id: this.#session.uuid,
            name: this.#session.username,
          },
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

  public disconnect() {
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
