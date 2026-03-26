import { Registry } from "./Registry.ts";

export class IndexedRegistry<K, V> extends Registry<K, V> {
  private readonly indices: ReadonlyMap<number, K>;

  public constructor(entries: { id: K; value: V }[]) {
    super(entries);
    this.indices = new Map<number, K>(
      entries.map((entry, index) => [index, entry.id]),
    );
  }

  public getByIndex(index: number): V | undefined {
    const id = this.indices.get(index);
    if (id === undefined) {
      return undefined;
    }

    return this.getById(id);
  }
}
