export class Registry<T> {
  public readonly entries: ReadonlyMap<string, T>;

  public constructor(entries: { id: string; value: T }[]) {
    this.entries = new Map<string, T>(
      entries.map((entry) => [entry.id, entry.value]),
    );
  }

  public getById(id: string): T | undefined {
    return this.entries.get(id);
  }
}
