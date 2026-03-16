/**
 * Represents the status of a {@link import("./Player.ts").Player}.
 */
export const enum PlayerStatus {
  /**
   * Player is not connected to a server.
   */
  DISCONNECTED,

  /**
   * Player is in the process of connecting to a server.
   */
  CONNECTING,

  /**
   * Player is connected and online on a server.
   */
  ONLINE,
}
