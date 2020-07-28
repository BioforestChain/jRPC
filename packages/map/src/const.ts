export const ANY_TRANSFER_TYPES = ["deserialize", "serialize", "both"] as const;
export const DESERIALIZABLE_TRANSFER_TYPES = ["deserialize", "both"] as const;
export const SERIALIZABLE_TRANSFER_TYPES = ["serialize", "both"] as const;
export const DESERIALIZEONLY_TRANSFER_TYPES = ["deserialize"] as const;
export const SERIALIZEONLY_TRANSFER_TYPES = ["serialize"] as const;
export const BOTHONLY_TRANSFER_TYPES = ["both"] as const;

export const MODE_TRANSFER_TYPES_MAP = {
  any: ANY_TRANSFER_TYPES,
  deserializable: DESERIALIZABLE_TRANSFER_TYPES,
  serializable: SERIALIZABLE_TRANSFER_TYPES,
  deserializeonly: DESERIALIZEONLY_TRANSFER_TYPES,
  serializeonly: SERIALIZEONLY_TRANSFER_TYPES,
  bothonly: BOTHONLY_TRANSFER_TYPES
} as const;
