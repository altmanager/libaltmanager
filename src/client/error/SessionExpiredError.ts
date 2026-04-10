export class SessionExpiredError extends Error {
  public readonly status: number;
  public readonly response: string;
  public constructor(status: number, response: string) {
    super("Authentication session expired");
    this.status = status;
    this.response = response;
  }
}
