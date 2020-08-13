import "@bfchain/comlink-typings";
import "./@types";
export * from "./const";
export * from "./transferHandlerMap";
export * from "./transferClassMap";
export * from "./transferProtoMap";

import { TransferHandlerMap } from "./transferHandlerMap";
import { TransferClassMap } from "./transferClassMap";
import { TransferProtoMap } from "./transferProtoMap";
import { WireValueType } from "@bfchain/comlink-typings";

export class TransferRepo<TA = Transferable> {
  readonly handlers = new TransferHandlerMap<TA>();
  readonly classes = new TransferClassMap<TA>();
  readonly protos = new TransferProtoMap<TA>();

  setPropMarker<
    V extends object,
    K extends BFChainComlink.TransferProtoKeyValue["Key"]
  >(obj: V, propMarker: K) {
    return this.protos.setInstance(obj, propMarker);
  }

  fromWireValue(wire: BFChainComlink.WireValue): any {
    let deserializeTransfer:
      | BFChainComlink.TransferProto.DeserializeOnly
      | undefined;
    switch (wire.type) {
      case WireValueType.PROTO:
        deserializeTransfer = this.protos.get(wire.name, "deserializable");
        break;
      case WireValueType.CLASS:
        deserializeTransfer = this.classes.get(wire.name, "deserializable");
        break;
      case WireValueType.HANDLER:
        deserializeTransfer = this.handlers.get(wire.name, "deserializable");
        break;
      case WireValueType.RAW:
        return wire.value;
      case WireValueType.RAW_ARRAY:
        return wire.value.map(v => this.fromWireValue(v));
    }
    if (!deserializeTransfer) {
      throw new ReferenceError(`could not found wire name:"${wire.name}".`);
    }
    return deserializeTransfer.deserialize(wire.value);
  }

  private _customTransferCache = new WeakMap<
    object,
    { serialized: BFChainComlink.WireValue; transfers: unknown[] }
  >();
  customTransfer<T extends object>(
    obj: T,
    transfers: TA[],
    serialized?: BFChainComlink.WireValue
  ) {
    this._customTransferCache.set(obj, {
      serialized: serialized || { type: WireValueType.RAW, value: obj },
      transfers
    });
    return obj;
  }

  fastToWireValue(value: any): [BFChainComlink.WireValue, TA[]] | undefined {
    const customTransfer = this._customTransferCache.get(value);
    if (customTransfer) {
      return [customTransfer.serialized, customTransfer.transfers as TA[]];
    }

    let serializeTransfer:
      | readonly [
          BFChainComlink.TransferKey,
          BFChainComlink.TransferProto.SerializeOnly<unknown, unknown, TA>
        ]
      | undefined;
    let wireType: BFChainComlink.DeserializableWireType = WireValueType.PROTO;
    /// 寻找 serializeTransfer
    serializeTransfer = this.protos.getByInstance(value, "serializable");
    if (!serializeTransfer) {
      serializeTransfer = this.classes.getByInstance(value, "serializable");
      wireType = WireValueType.CLASS;
      if (!serializeTransfer) {
        for (const handlerTransfer of this.handlers.entries("serializable")) {
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
  }

  toWireValue(value: any): [BFChainComlink.WireValue, TA[]] {
    return (
      this.fastToWireValue(value) || /* 否则直接返回原始对象 */ [
        { type: WireValueType.RAW, value },
        []
      ]
    );
  }
}
