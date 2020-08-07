import { THROW_MARKER } from "@bfchain/comlink-typings";
import { transferProtos } from "@bfchain/comlink-map";
export const throwTransferProto: BFChainComlink.TransferProto<
  BFChainComlink.ThrowMarked,
  BFChainComlink.SerializedThrownValue
> = {
  serialize(error) {
    let serialized: BFChainComlink.SerializedThrownValue;
    if (error instanceof Error) {
      serialized = {
        isError: true,
        value: { message: error.message, name: error.name, stack: error.stack }
      };
    } else {
      serialized = {
        isError: false,
        value: error
      };
    }
    return [serialized, []];
  },
  deserialize(serialized) {
    if (serialized.isError) {
      throw Object.assign(
        new Error(serialized.value.message),
        serialized.value
      );
    } else {
      throw serialized.value;
    }
  }
};
transferProtos.set(THROW_MARKER, throwTransferProto);
