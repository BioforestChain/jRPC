import {
  transferHandlers,
  transferClasses,
  transferProtos
} from "@bfchain/comlink-map";
import { WireValueType } from "@bfchain/comlink-typings";

export function toWireValue(
  id: BFChainComlink.WireId,
  value: any
): [BFChainComlink.WireValue, Transferable[]] {
  const customTransfer = _customTransferCache.get(value);
  if (customTransfer) {
    return [
      { id, type: WireValueType.RAW, value: customTransfer.serialized },
      customTransfer.transfers
    ];
  }

  let serializeTransfer:
    | readonly [
        BFChainComlink.TransferKey,
        BFChainComlink.TransferProto.SerializeOnly
      ]
    | undefined;
  let wireType: BFChainComlink.DeserializableWireType = WireValueType.PROTO;
  /// 寻找 serializeTransfer
  serializeTransfer = transferProtos.getByInstance(value, "serializable");
  if (!serializeTransfer) {
    serializeTransfer = transferClasses.getByInstance(value, "serializable");
    wireType = WireValueType.CLASS;
    if (!serializeTransfer) {
      for (const handlerTransfer of transferHandlers.entries("serializable")) {
        if (handlerTransfer[1].canHandle(value)) {
          serializeTransfer = handlerTransfer;
          wireType = WireValueType.HANDLER;
          break;
        }
      }
    }
  }
  /// 如果可以将对象进行序列化
  if (serializeTransfer) {
    const [serializedValue, transferables] = serializeTransfer[1].serialize(
      value
    );
    return [
      {
        id,
        type: wireType,
        name: serializeTransfer[0],
        value: serializedValue
      },
      transferables
    ];
  }

  /// 否则直接返回原始对象
  return [{ id, type: WireValueType.RAW, value }, []];
}
const _customTransferCache = new WeakMap<
  object,
  { serialized: object; transfers: Transferable[] }
>();
export function customTransfer<T extends object>(
  obj: T,
  transfers: Transferable[],
  serialized = obj
) {
  _customTransferCache.set(obj, { serialized, transfers });
  return obj;
}
