export const ANY_TRANSFER_TYPES = ["deserialize", "serialize", "both"] as const;
export const DESERIALIZABLE_TRANSFER_TYPES = ["deserialize", "both"] as const;
export const SERIALIZABLE_TRANSFER_TYPES = ["serialize", "both"] as const;
export const DESERIALIZEONLY_TRANSFER_TYPES = ["deserialize"] as const;
export const SERIALIZEONLY_TRANSFER_TYPES = ["serialize"] as const;
export const BOTHONLY_TRANSFER_TYPES = ["both"] as const;

export const MODE_TRANSFER_TYPES_KEY = {
  any: "any",
  deserializable: "deserializable",
  serializable: "serializable",
  deserializeonly: "deserializeonly",
  serializeonly: "serializeonly",
  bothonly: "bothonly"
} as const;

export const MODE_TRANSFER_TYPES_MAP = {
  [MODE_TRANSFER_TYPES_KEY.any]: ANY_TRANSFER_TYPES,
  [MODE_TRANSFER_TYPES_KEY.deserializable]: DESERIALIZABLE_TRANSFER_TYPES,
  [MODE_TRANSFER_TYPES_KEY.serializable]: SERIALIZABLE_TRANSFER_TYPES,
  [MODE_TRANSFER_TYPES_KEY.deserializeonly]: DESERIALIZEONLY_TRANSFER_TYPES,
  [MODE_TRANSFER_TYPES_KEY.serializeonly]: SERIALIZEONLY_TRANSFER_TYPES,
  [MODE_TRANSFER_TYPES_KEY.bothonly]: BOTHONLY_TRANSFER_TYPES
} as const;

export const TRANSFER_SYMBOL: BFChainComlink.TransferClass.TransferSymbol = Symbol(
  "transfer.class"
) as BFChainComlink.TransferClass.TransferSymbol;
