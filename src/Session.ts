/**
 * Represents a Minecraft authentication session.
 */
export interface Session {
  /**
   * Microsoft access token.
   */
  token: string;

  /**
   * Player’s Minecraft UUID.
   */
  uuid: string;

  /**
   * Player’s Minecraft username.
   */
  username: string;
}
