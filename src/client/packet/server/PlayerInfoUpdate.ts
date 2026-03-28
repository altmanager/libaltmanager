import type { NBT } from "prismarine-nbt";
import { ServerPacket } from "../ServerPacket.ts";
import { State } from "../../State.ts";

export const enum PlayerInfoAction {
  ADD_PLAYER,
  INITIALIZE_CHAT,
  UPDATE_GAME_MODE,
  UPDATE_LISTED,
  UPDATE_LATENCY,
  UPDATE_DISPLAY_NAME,
  UPDATE_LIST_PRIORITY,
  UPDATE_HAT,
}

export interface AddPlayerPayload {
  name: string;
  properties: { name: string; value: string; signature?: string }[];
}

export interface InitializeChatPayload {
  data?: {
    chatSessionId: string;
    publicKeyExpiry: bigint;
    publicKey: Uint8Array;
    publicKeySignature: Uint8Array;
  };
}

export interface UpdateGameModePayload {
  gamemode: number;
}
export interface UpdateListedPayload {
  listed: boolean;
}
export interface UpdateLatencyPayload {
  ping: number;
}
export interface UpdateDisplayNamePayload {
  displayName?: NBT;
}
export interface UpdateListPriorityPayload {
  priority: number;
}
export interface UpdateHatPayload {
  visible: boolean;
}

export interface PlayerActionMap {
  [PlayerInfoAction.ADD_PLAYER]: AddPlayerPayload;
  [PlayerInfoAction.INITIALIZE_CHAT]: InitializeChatPayload;
  [PlayerInfoAction.UPDATE_GAME_MODE]: UpdateGameModePayload;
  [PlayerInfoAction.UPDATE_LISTED]: UpdateListedPayload;
  [PlayerInfoAction.UPDATE_LATENCY]: UpdateLatencyPayload;
  [PlayerInfoAction.UPDATE_DISPLAY_NAME]: UpdateDisplayNamePayload;
  [PlayerInfoAction.UPDATE_LIST_PRIORITY]: UpdateListPriorityPayload;
  [PlayerInfoAction.UPDATE_HAT]: UpdateHatPayload;
}

export interface PlayerInfo {
  uuid: string;
  actions: Partial<PlayerActionMap>;
}

export class PlayerInfoUpdate extends ServerPacket {
  public static override readonly ID = 0x44;
  public static override readonly STATE = State.PLAY;

  public readonly activeActions: ReadonlySet<PlayerInfoAction>;
  public readonly players: PlayerInfo[];

  public constructor(buf: Uint8Array<ArrayBuffer>) {
    super(buf);
    this.activeActions = this.readEnumSet<PlayerInfoAction>(8);
    this.players = this.readPrefixedArray(() => this.readPlayerInfo());
  }

  private readPlayerInfo(): PlayerInfo {
    const uuid = this.readUuid();
    const actions = Object.fromEntries(
      Array.from(this.activeActions).map((
        action,
      ) => [action, this.readAction(action)]),
    ) as Partial<PlayerActionMap>;

    return { uuid, actions };
  }

  private readAction<A extends PlayerInfoAction>(
    action: A,
  ): PlayerActionMap[A] {
    const readers: { [K in PlayerInfoAction]: () => PlayerActionMap[K] } = {
      [PlayerInfoAction.ADD_PLAYER]: () => ({
        name: this.readString(),
        properties: this.readPrefixedArray(() => ({
          name: this.readString(),
          value: this.readString(),
          signature: this.readPrefixedOptional(() => this.readString()) ??
            undefined,
        })),
      }),

      [PlayerInfoAction.INITIALIZE_CHAT]: () => ({
        data: this.readPrefixedOptional(() => ({
          chatSessionId: this.readUuid(),
          publicKeyExpiry: this.readLong(),
          publicKey: this.readPrefixedByteArray(),
          publicKeySignature: this.readPrefixedByteArray(),
        })) ?? undefined,
      }),

      [PlayerInfoAction.UPDATE_GAME_MODE]: () => ({
        gamemode: this.readVarInt(),
      }),
      [PlayerInfoAction.UPDATE_LISTED]: () => ({ listed: this.readBoolean() }),
      [PlayerInfoAction.UPDATE_LATENCY]: () => ({ ping: this.readVarInt() }),
      [PlayerInfoAction.UPDATE_DISPLAY_NAME]: () => ({
        displayName: this.readPrefixedOptional(() => this.readNbt()) ??
          undefined,
      }),
      [PlayerInfoAction.UPDATE_LIST_PRIORITY]: () => ({
        priority: this.readVarInt(),
      }),
      [PlayerInfoAction.UPDATE_HAT]: () => ({ visible: this.readBoolean() }),
    };

    return readers[action]() as PlayerActionMap[A];
  }
}
