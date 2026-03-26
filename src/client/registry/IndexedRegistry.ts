import { Registry } from "./Registry.ts";

export class IndexedRegistry<T> extends Registry<T> {
  private readonly indices: ReadonlyMap<number, string>;

  public constructor(entries: { id: string; value: T }[]) {
    super(entries);
    this.indices = new Map<number, string>(
      entries.map((entry, index) => [index, entry.id]),
    );
  }

  public getByIndex(index: number): T | undefined {
    const id = this.indices.get(index);
    if (id === undefined) {
      return undefined;
    }

    return this.getById(id);
  }
}
