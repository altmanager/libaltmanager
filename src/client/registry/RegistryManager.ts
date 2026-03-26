import type { RegistryId } from "./RegistryId.ts";
import type { RegistryTypeMap } from "./RegistryTypeMap.ts";

export class RegistryManager {
  private readonly registries: Partial<
    {
      [K in RegistryId]: RegistryTypeMap[K];
    }
  > = {};

  public get<K extends RegistryId>(id: K): RegistryTypeMap[K] {
    const registry = this.registries[id];
    if (registry === undefined) {
      throw new Error(`Registry ${id} is not registered`);
    }
    return registry;
  }

  public set<K extends RegistryId>(
    id: K,
    registry: RegistryTypeMap[K],
  ): void {
    this.registries[id] = registry;
  }
}
