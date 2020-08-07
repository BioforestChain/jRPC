import { WireValueType } from "@bfchain/comlink-typings";
import {
  transferHandlers,
  transferProtos,
  transferClasses
} from "@bfchain/comlink-map";

export function fromWireValue(wire: BFChainComlink.WireValue): any {
  let deserializeTransfer:
    | BFChainComlink.TransferProto.DeserializeOnly
    | undefined;
  switch (wire.type) {
    case WireValueType.PROTO:
      deserializeTransfer = transferProtos.get(wire.name, "deserializable");
      break;
    case WireValueType.CLASS:
      deserializeTransfer = transferClasses.get(wire.name, "deserializable");
      break;
    case WireValueType.HANDLER:
      deserializeTransfer = transferHandlers.get(wire.name, "deserializable");
      break;
    case WireValueType.RAW:
      return wire.value;
    case WireValueType.RAW_ARRAY:
      return wire.value.map(fromWireValue);
  }
  if (!deserializeTransfer) {
    throw new ReferenceError(`could not found wire name:"${wire.name}".`);
  }
  deserializeTransfer.deserialize(wire.value);
}
