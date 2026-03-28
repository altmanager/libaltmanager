import type { NBT } from "prismarine-nbt";
import type { PlayerInfo } from "./packet/server/PlayerInfoUpdate.ts";

/**
 * Defines the events emitted by a {@link import("./Client.ts").Client}.
 */
export interface ClientEvents {
  login: void;
  disconnect: void;
  chat: NBT;
  kick: string | NBT;
  healthChange: { health: number; food: number; saturation: number };
  playerListRemove: string[];
  playerListUpdate: PlayerInfo[];
}
