import type { RegistryId } from "./RegistryId.ts";
import type { ChatType } from "./ChatType.ts";
import { IndexedRegistry } from "./IndexedRegistry.ts";

export interface RegistryTypeMap {
  [RegistryId.CHAT_TYPE]: IndexedRegistry<ChatType>;
}
