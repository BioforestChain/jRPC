import { ComlinkCore, STORE_TYPE, helper, ExportStore, ImportStore } from "@bfchain/link-core";
import { EmscriptenReflect, isObj } from "@bfchain/link-typings";
import { HolderReflect } from "./HolderReflect";
import { CallbackToAsync } from "./helper";
import {
  IOB_EFT_Factory_Map,
  getFunctionType,
  getFunctionExportDescription,
} from "@bfchain/link-protocol";
import { AsyncModelTransfer } from "./AsyncModelTransfer";

export class ComlinkAsync
  extends ComlinkCore<ComlinkProtocol.IOB, ComlinkProtocol.TB, ComlinkProtocol.IOB_E>
  implements BFChainLink.ComlinkAsync {
  constructor(port: ComlinkProtocol.BinaryPort, name: string, isShareBuildIn: boolean) {
    super(port, name, isShareBuildIn);
  }

  readonly transfer = new AsyncModelTransfer(this);
  readonly exportStore = new ExportStore(this.name, this.isShareBuildIn);
  readonly importStore = new ImportStore<
    ComlinkProtocol.IOB,
    ComlinkProtocol.TB,
    ComlinkProtocol.IOB_E
  >(this.name, this.port, this.transfer, this.isShareBuildIn);

  // readonly holderStore = new HolderStore(this.name);

  protected $getEsmReflectHanlder(opeartor: EmscriptenReflect) {
    const hanlder = super.$getEsmReflectHanlder(opeartor);
    if (opeartor === EmscriptenReflect.Apply || opeartor === EmscriptenReflect.SyncApply) {
      const applyHanlder = (target: Function, args: unknown[]) => {
        if (target === Function.prototype.toString) {
          const ctx = args[0] as Function;
          const exportDescriptor = getFunctionExportDescription(ctx);
          /// 保护源码
          if (!exportDescriptor.showSourceCode) {
            // console.log("get to string from remote");
            return IOB_EFT_Factory_Map.get(getFunctionType(ctx))!.toString({ name: ctx.name });
          }
        }
        return hanlder.fun(target, args);
      };
      return { ...hanlder, fun: applyHanlder };
    }
    return hanlder;
  }

  async import<T>(key = "default"): Promise<BFChainLink.AsyncUtil.Remote<T>> {
    const importModule = await CallbackToAsync(this.$getImportModule, [], this);
    return Reflect.get(importModule, key);
  }
  push(obj: object) {
    return CallbackToAsync(this.$pushToRemote, [obj], this);
  }
}
