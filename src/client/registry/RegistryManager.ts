import type { RegistryId } from "./RegistryId.ts";
import type { Registry } from "./Registry.ts";
import type { RegistryTypeMap } from "./RegistryTypeMap.ts";

export class RegistryManager {
  private readonly registries = {} as {
    [K in RegistryId]: Registry<RegistryTypeMap[K]>;
  };

  public get<K extends RegistryId>(id: K): Registry<RegistryTypeMap[K]> {
    return this.registries[id];
  }

  public set<K extends RegistryId>(
    id: K,
    registry: Registry<RegistryTypeMap[K]>,
  ): void {
    this.registries[id] = registry;
  }
}
