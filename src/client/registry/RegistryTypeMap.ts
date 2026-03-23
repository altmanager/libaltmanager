import type { RegistryId } from "./RegistryId.ts";
import type { ChatType } from "./ChatType.ts";

export interface RegistryTypeMap {
  [RegistryId.CHAT_TYPE]: ChatType;
}
