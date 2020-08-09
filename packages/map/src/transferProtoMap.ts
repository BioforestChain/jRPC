import { TransferMap } from "./TransferMap";
import { TRANSFER_PROTO_SYMBOL } from "@bfchain/comlink-typings";

export class TransferProtoMap<
  TA = Transferable,
  I = unknown,
  S = unknown
> extends TransferMap<BFChainComlink.TransferProtoKeyValue<I, S, TA>> {
  set(
    name: BFChainComlink.TransferProtoKeyValue["Key"],
    transferProto: BFChainComlink.TransferProto.Any<I, S, TA>
  ) {
    /// try remove old one first. ensure transferClass exists in one map only
    if (this.delete(name)) {
      console.warn("Registery TransferProto %s again", name);
    }

    let type: BFChainComlink.TransferMap.Type;
    if ("serialize" in transferProto) {
      if ("deserialize" in transferProto) {
        type = "both";
        this._map[type].set(name, {
          type,
          serialize: transferProto.serialize,
          deserialize: transferProto.deserialize
        });
      } else {
        type = "serialize";
        this._map[type].set(name, {
          type,
          serialize: transferProto.serialize
        });
      }
    } else {
      type = "deserialize";
      this._map[type].set(name, {
        type,
        deserialize: transferProto.deserialize
      });
    }
    /// falg the TransferName's TransferType
    this._nameTypeMap.set(name, type);
  }

  getByInstance<M extends BFChainComlink.TransferMap.TypeModel>(
    instance: object,
    mode: M = "any" as M
  ) {
    const name =
      instance &&
      (instance as BFChainComlink.TransferProto.TransferAbleInstance)[
        TRANSFER_PROTO_SYMBOL
      ];
    if (typeof name === "string") {
      const value = this.get(name, mode);
      if (value) {
        return [name, value] as const;
      }
    }
  }
  setInstance<
    V extends object,
    K extends BFChainComlink.TransferProtoKeyValue["Key"]
  >(instance: V, propMarker: K) {
    Object.defineProperty(instance, TRANSFER_PROTO_SYMBOL, {
      value: propMarker,
      writable: true,
      configurable: true,
      enumerable: false
    });
    return instance as BFChainComlink.TransferProto.TransferMarked<K, V>;
  }
}
