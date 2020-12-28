import { ComlinkCore } from "@bfchain/comlink-core";
import {
  getFunctionExportDescription,
  IOB_EFT_Factory_Map,
  getFunctionType,
} from "@bfchain/comlink-protocol";
import { EmscriptenReflect } from "@bfchain/comlink-typings";
import { CallbackToSync, IS_ASYNC_APPLY_FUN_MARKER } from "./helper";
import { SyncModelTransfer } from "./SyncModelTransfer";

export class ComlinkSync
  extends ComlinkCore<ComlinkProtocol.IOB, ComlinkProtocol.TB, ComlinkProtocol.IOB_E>
  implements BFChainComlink.ComlinkSync {
  constructor(port: ComlinkProtocol.BinaryPort, name: string) {
    super(port, name);
  }
  readonly transfer: BFChainComlink.ModelTransfer<
    ComlinkProtocol.IOB,
    ComlinkProtocol.TB
  > = new SyncModelTransfer(this);

  // /**
  //  * ref fun statis toString
  //  */
  // private _rfsts = refFunctionStaticToStringFactory();

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
      return { type: hanlder.type, fun: applyHanlder };
    }
    return hanlder;
  }

  import<T>(key = "default") {
    const importModule = CallbackToSync(this.$getImportModule, [], this);
    return Reflect.get(importModule, key) as T;
  }
  importAsSync<T>(key = "default") {
    return this.asyncToSync(this.import<T>(key));
  }
  asyncToSync<T>(fun: T) {
    if (typeof fun === "function") {
      Reflect.set(fun, IS_ASYNC_APPLY_FUN_MARKER, true);
    }
    return fun as BFChainComlink.AsyncToSync<T>;
  }
}
