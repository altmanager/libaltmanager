import { kJSON } from "@atikayda/kjson";
import type nbt from "prismarine-nbt";
import type { NBT } from "prismarine-nbt";
import type { Session } from "./Session.ts";
import { PlayerStatus } from "./PlayerStatus.ts";
import { TypedEventTarget } from "./TypedEventTarget.ts";
import type { PlayerEvents } from "./PlayerEvents.ts";
import { Client } from "./client/Client.ts";
import { PlayerInfoAction } from "./client/packet/server/PlayerInfoUpdate.ts";

/**
 * Represents a controllable Minecraft player.
 */
export class Player extends TypedEventTarget<PlayerEvents> {
  private static readonly DEFAULT_PORT = 25565;

  readonly #session: Session;
  private client: Client | null = null;
  #status: PlayerStatus = PlayerStatus.DISCONNECTED;
  #health: number = 0;
  #onlinePlayers = new Map<string, {
    name: string;
    displayName?: NBT;
    ping: number;
    priority: number;
    gamemode: number;
    listed: boolean;
  }>();

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
   * Current health of the player.
   */
  public get health(): number {
    return this.#health;
  }

  /**
   * List of online players.
   */
  public get onlinePlayers(): {
    uuid: string;
    name: string;
    displayName?: unknown;
    ping: number;
    priority: number;
    gamemode: number;
    listed: boolean;
  }[] {
    return Array.from(this.#onlinePlayers.entries()).map(([uuid, player]) => ({
      uuid,
      ...player,
      displayName: player.displayName === undefined ? undefined : Player.simplifyComponent(player.displayName),
    })).sort((a, b) => b.priority - a.priority);
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

      const client = new Client(this.#session);
      this.client = client;

      client.addEventListener("login", () => {
        this.#status = PlayerStatus.ONLINE;
        this.dispatchEvent("statusChange", void 0);
        resolve();
      }, { once: true });

      client.addEventListener("sessionExpired", (e) => {
        this.#status = PlayerStatus.DISCONNECTED;
        this.client = null;
        reject(e.detail);
      });

      client.addEventListener("disconnect", () => {
        if (this.#status === PlayerStatus.CONNECTING) {
          reject(new Error("Disconnected before login"));
        }
        this.#status = PlayerStatus.DISCONNECTED;
        this.client = null;
        this.#onlinePlayers.clear();
        this.dispatchEvent("playerListChange", void 0);
        this.dispatchEvent("statusChange", void 0);
      }, { once: true });

      client.addEventListener("chat", (message) => {
        this.dispatchEvent("chat", Player.simplifyComponent(message.detail));
      });

      client.addEventListener("kick", (reason) => {
        this.dispatchEvent(
          "kick",
          typeof reason.detail === "string"
            ? kJSON.parse(reason.detail)
            : Player.simplifyComponent(reason.detail),
        );
      });

      client.addEventListener("healthChange", (e) => {
        this.#health = e.detail.health;
        this.dispatchEvent("statusChange", void 0);
      });

      client.addEventListener("playerListRemove", (e) => {
        for (const uuid of e.detail) {
          this.#onlinePlayers.delete(uuid);
        }
        this.dispatchEvent("playerListChange", void 0);
      });

      client.addEventListener("playerListUpdate", (e) => {
        for (const { uuid, actions } of e.detail) {
          const existing = this.#onlinePlayers.get(uuid);

          if (
            existing === undefined &&
            actions[PlayerInfoAction.ADD_PLAYER] === undefined
          ) {
            continue;
          }

          const entry = existing ?? {} as Partial<NonNullable<typeof existing>>;

          entry.name = actions[PlayerInfoAction.ADD_PLAYER]?.name ??
            existing!.name;
          entry.displayName =
            actions[PlayerInfoAction.UPDATE_DISPLAY_NAME]?.displayName ??
              existing?.displayName;
          entry.ping = actions[PlayerInfoAction.UPDATE_LATENCY]?.ping ??
            existing?.ping ?? 0;
          entry.priority =
            actions[PlayerInfoAction.UPDATE_LIST_PRIORITY]?.priority ??
              existing?.priority ?? 0;
          entry.gamemode =
            actions[PlayerInfoAction.UPDATE_GAME_MODE]?.gamemode ??
              existing?.gamemode ?? 0;
          entry.listed = actions[PlayerInfoAction.UPDATE_LISTED]?.listed ??
            existing?.listed ?? true;

          this.#onlinePlayers.set(uuid, entry);
        }
        this.dispatchEvent("playerListChange", void 0);
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
   * Resurrects the player.
   */
  public async respawn(): Promise<void> {
    if (this.client === null) {
      throw new Error("Player is not connected");
    }
    await this.client.respawn();
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

  /**
   * Sends an unsigned command.
   *
   * @param command Command to send, excluding the first `/`.
   */
  public async command(command: string): Promise<void> {
    if (this.client === null) {
      throw new Error("Player is not connected");
    }
    return await this.client.command(command);
  }
}
