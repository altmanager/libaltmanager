/**
 * Defines the events emitted by a {@link import("./Player.ts").Player}.
 */
export interface PlayerEvents {
  /**
   * Fired when the player’s {@link import("./PlayerStatus.ts").PlayerStatus} changes.
   */
  statusChange: void;

  /**
   * Fired when the player receives a chat message.
   */
  chat: unknown;
}
