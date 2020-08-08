import type { TransferRepo } from "@bfchain/comlink-map";
import { WireValueType } from "@bfchain/comlink-typings";

export function toWireValue<TA = Transferable>(
  tp: TransferRepo<TA>,
  value: any
): [BFChainComlink.WireValue, TA[]] {
  const customTransfer = _customTransferCache.get(value);
  if (customTransfer) {
    return [
      { type: WireValueType.RAW, value: customTransfer.serialized },
      customTransfer.transfers as TA[]
    ];
  }

  let serializeTransfer:
    | readonly [
        BFChainComlink.TransferKey,
        BFChainComlink.TransferProto.SerializeOnly<unknown, unknown, TA>
      ]
    | undefined;
  let wireType: BFChainComlink.DeserializableWireType = WireValueType.PROTO;
  /// 寻找 serializeTransfer
  serializeTransfer = tp.protos.getByInstance(value, "serializable");
  if (!serializeTransfer) {
    serializeTransfer = tp.classes.getByInstance(value, "serializable");
    wireType = WireValueType.CLASS;
    if (!serializeTransfer) {
      for (const handlerTransfer of tp.handlers.entries("serializable")) {
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
        type: wireType,
        name: serializeTransfer[0],
        value: serializedValue
      },
      transferables as TA[]
    ];
  }

  /// 否则直接返回原始对象
  return [{ type: WireValueType.RAW, value }, []];
}
const _customTransferCache = new WeakMap<
  object,
  { serialized: object; transfers: unknown[] }
>();
export function customTransfer<T extends object, TA = Transferable>(
  obj: T,
  transfers: TA[],
  serialized = obj
) {
  _customTransferCache.set(obj, { serialized, transfers });
  return obj;
}
