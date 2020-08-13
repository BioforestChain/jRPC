export const enum SerializationTag {
  kVersion = 0xff,
  kPadding = 0,
  Null,
  Undefined,

  Set,
  Map,
  Object,
  
  String,
  Symbol,

  NaN,
  Inf,
  Int8,
  Uint8,
  Int16,
  Uint16,
  Int32,
  Uint32,
  Int64,
  Uint64,
  BigInt
}
