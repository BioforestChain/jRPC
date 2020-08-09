import { WireValueType } from "@bfchain/comlink-typings";
import type { TransferRepo } from "@bfchain/comlink-map";

export function fromWireValue<TA = Transferable>(
  tp: TransferRepo<TA>,
  wire: BFChainComlink.WireValue
): any {
  let deserializeTransfer:
    | BFChainComlink.TransferProto.DeserializeOnly
    | undefined;
  switch (wire.type) {
    case WireValueType.PROTO:
      deserializeTransfer = tp.protos.get(wire.name, "deserializable");
      break;
    case WireValueType.CLASS:
      deserializeTransfer = tp.classes.get(wire.name, "deserializable");
      break;
    case WireValueType.HANDLER:
      deserializeTransfer = tp.handlers.get(wire.name, "deserializable");
      break;
    case WireValueType.RAW:
      return wire.value;
    case WireValueType.RAW_ARRAY:
      return wire.value.map(v => fromWireValue<TA>(tp, v));
  }
  if (!deserializeTransfer) {
    throw new ReferenceError(`could not found wire name:"${wire.name}".`);
  }
  return deserializeTransfer.deserialize(wire.value);
}
