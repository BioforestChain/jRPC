import { ComlinkCore, STORE_TYPE, helper } from "@bfchain/comlink-core";
import { EmscriptenReflect, isObj } from "@bfchain/comlink-typings";
import { HolderReflect } from "./HolderReflect";
import { createHolderProxyHanlder } from "./AsyncValueProxy";
import { CallbackToAsync } from "./helper";
import {
  ModelTransfer,
  globalSymbolStore,
  IOB_Extends_Type,
  IOB_EFT_Factory_Map,
  getFunctionType,
  IOB_Extends_Object_Status,
  IOB_Extends_Function_ToString_Mode,
  getFunctionExportDescription,
  IMPORT_FUN_EXTENDS_SYMBOL,
  refFunctionStaticToStringFactory,
} from "@bfchain/comlink-protocol";
import { HolderStore } from "./HolderStore";
import { createHolder } from "./Holder";
import { AsyncModelTransfer } from "./AsyncModelTransfer";

export class ComlinkAsync
  extends ComlinkCore<ComlinkProtocol.IOB, ComlinkProtocol.TB, ComlinkProtocol.IOB_E>
  implements BFChainComlink.ComlinkAsync {
  constructor(port: ComlinkProtocol.BinaryPort, name: string) {
    super(port, name);
  }
  wrap<T>(val: BFChainComlink.HolderReflect<T>): BFChainComlink.AsyncUtil.Remote<T> {
    throw new Error("Method not implemented.");
  }
  readonly transfer = new AsyncModelTransfer(this);

  // readonly holderStore = new HolderStore(this.name);

  protected $getEsmReflectHanlder(opeartor: EmscriptenReflect) {
    const hanlder = super.$getEsmReflectHanlder(opeartor);
    if (opeartor === EmscriptenReflect.Apply) {
      const applyHanlder = (((target: Function, args: unknown[]) => {
        if (target === Function.prototype.toString) {
          const ctx = args[0] as Function;
          const exportDescriptor = getFunctionExportDescription(ctx);
          /// 保护源码
          if (!exportDescriptor.showSourceCode) {
            // console.log("get to string from remote");
            return IOB_EFT_Factory_Map.get(getFunctionType(ctx))!.toString({ name: ctx.name });
          }
        }
        return hanlder(target, args);
      }) as unknown) as typeof hanlder;
      return applyHanlder;
    }
    return hanlder;
  }

  async import<T>(key = "default"): Promise<BFChainComlink.AsyncUtil.Remote<T>> {
    const importModule = await CallbackToAsync(this.$getImportModule, [], this);
    return Reflect.get(importModule, key);
  }
}
