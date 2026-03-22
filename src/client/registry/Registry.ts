export class Registry<T> {
  private readonly identifiers: Record<string, number>;
  public readonly entries: { id: string; value: T }[];

  public constructor(entries: { id: string; value: T }[]) {
    this.entries = entries;
    this.identifiers = entries.reduce<Record<string, number>>(
      (acc, entry, index) => {
        acc[entry.id] = index;
        return acc;
      },
      {},
    );
  }

  public getByIndex(index: number): T | undefined {
    return this.entries[index]?.value;
  }

  public getById(id: string): T | undefined {
    return this.entries[this.identifiers[id]]?.value;
  }
}
