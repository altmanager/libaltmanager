export class Registry<T> {
  private readonly identifiers: Map<string, number>;
  public readonly entries: ReadonlyArray<{ id: string; value: T }>;

  public constructor(entries: { id: string; value: T }[]) {
    this.entries = Array.from(entries);
    this.identifiers = new Map(
      entries.map((entry, index) => [entry.id, index]),
    );
  }

  public getByIndex(index: number): T | undefined {
    return this.entries[index]?.value;
  }

  public getById(id: string): T | undefined {
    const index = this.identifiers.get(id);
    if (index === undefined) {
      return undefined;
    }
    return this.getByIndex(index);
  }
}
