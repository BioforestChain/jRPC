import { TransferMap } from "./TransferMap";
import { TRANSFER_CLASS_SYMBOL } from "@bfchain/comlink-typings";

export class TransferClassMap<
  TA = Transferable,
  C extends BFChainComlink.AnyClass = BFChainComlink.AnyClass,
  S = unknown
> extends TransferMap<BFChainComlink.TransferClassKeyValue<C, S, TA>> {
  set(
    name: BFChainComlink.TransferClassKeyValue["Key"],
    transferClass: BFChainComlink.TransferClass.IAny<C, S, TA>
  ) {
    /// try remove old one first. ensure transferClass exists in one map only
    if (this.delete(name)) {
      console.warn("Registery TransferClass %s again", name);
    }
    let type: BFChainComlink.TransferMap.Type;
    if ("ctor" in transferClass) {
      const ctor = transferClass.ctor;
      /// 如果原来是有注册的名称,那么移除掉原本注册的
      if (ctor.prototype.hasOwnProperty(TRANSFER_CLASS_SYMBOL)) {
        this.delete(
          (ctor as BFChainComlink.TransferClass.CtorWithSymbol).prototype[
            TRANSFER_CLASS_SYMBOL
          ]
        );
      }
      /// 保存name到原型链上
      Object.defineProperty(ctor.prototype, TRANSFER_CLASS_SYMBOL, {
        value: name,
        enumerable: false,
        writable: false,
        configurable: true
      });

      if ("deserialize" in transferClass) {
        type = "both";
        this._map[type].set(name, {
          type,
          ctor: ctor,
          serialize: transferClass.serialize,
          deserialize: transferClass.deserialize
        });
      } else {
        type = "serialize";
        this._map[type].set(name, {
          type,
          ctor: ctor,
          serialize: transferClass.serialize
        });
      }
    } else {
      type = "deserialize";
      this._map[type].set(name, {
        type,
        deserialize: transferClass.deserialize
      });
    }
    /// falg the TransferName's TransferType
    this._nameTypeMap.set(name, type);
  }
  registryClass<CC extends C = C, SS extends S = S>(
    name: BFChainComlink.TransferClassKeyValue["Key"],
    ctor?: CC,
    serialize?: BFChainComlink.TransferClass.SerializeOnly<
      CC,
      SS,
      TA
    >["serialize"],
    deserialize?: BFChainComlink.TransferClass.DeserializeOnly<
      CC,
      SS,
      TA
    >["deserialize"]
  ) {
    let ai: BFChainComlink.TransferClass.IAny<CC, SS, TA> | undefined;
    if (ctor && serialize) {
      if (deserialize) {
        ai = { ctor, serialize, deserialize };
      } else {
        ai = { ctor, serialize };
      }
    } else if (deserialize) {
      ai = { deserialize };
    }
    if (ai) {
      this.set(name, ai);
      return true;
    }
    return false;
  }

  getByInstance<M extends BFChainComlink.TransferMap.TypeModel>(
    instance: unknown,
    mode: M = "any" as M
  ) {
    const name = instance && (instance as any)[TRANSFER_CLASS_SYMBOL];
    if (typeof name === "string") {
      const value = this.get(name, mode);
      if (value) {
        return [name, value] as const;
      }
    }
  }
  delete(name: BFChainComlink.TransferClassKeyValue["Key"]) {
    const type = this._nameTypeMap.get(name);
    if (type) {
      const transfer = this._map[type].get(name);
      if (transfer && "ctor" in transfer) {
        delete transfer.ctor.prototype[TRANSFER_CLASS_SYMBOL];
      }
    }
    return super.delete(name);
  }
}
