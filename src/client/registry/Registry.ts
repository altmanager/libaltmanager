export class Registry<K, V> {
  public readonly entries: ReadonlyMap<K, V>;

  public constructor(entries: { id: K; value: V }[]) {
    this.entries = new Map<K, V>(
      entries.map((entry) => [entry.id, entry.value]),
    );
  }

  public getById(id: K): V | undefined {
    return this.entries.get(id);
  }
}
