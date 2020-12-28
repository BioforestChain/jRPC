import { ComlinkCore } from "@bfchain/comlink-core";
import {
  getFunctionExportDescription,
  IOB_EFT_Factory_Map,
  getFunctionType,
} from "@bfchain/comlink-protocol";
import { EmscriptenReflect } from "@bfchain/comlink-typings";
import { CallbackToSync } from "./helper";
import { PROTOCAL_SENDER, IS_ASYNC_APPLY_FUN_MARKER, IS_SYNC_APPLY_FUN_MARKER } from "./const";
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
      if (Reflect.get(fun, IS_ASYNC_APPLY_FUN_MARKER)) {
        return fun as BFChainComlink.AsyncToSync<T>;
      }
      const send = Reflect.get(fun, PROTOCAL_SENDER);
      if (send) {
        return new Proxy(fun, {
          get(_target, prop, r) {
            if (prop === IS_ASYNC_APPLY_FUN_MARKER) {
              return true;
            }
            return Reflect.get(fun, prop, r);
          },
          apply: (_target: Function, thisArg: any, argArray?: any) => {
            return send([EmscriptenReflect.SyncApply, thisArg, ...argArray], true);
          },
        }) as BFChainComlink.AsyncToSync<T>;
      }
    }
    throw new TypeError();
  }
  importAsAsync<T>(key = "default") {
    return this.syncToAsync(this.import<T>(key));
  }
  syncToAsync<T>(fun: T) {
    if (typeof fun === "function") {
      if (Reflect.get(fun, IS_SYNC_APPLY_FUN_MARKER)) {
        return fun as BFChainComlink.SyncToAsync<T>;
      }
      const send = Reflect.get(fun, PROTOCAL_SENDER);
      if (send) {
        return new Proxy(fun, {
          get(_target, prop, r) {
            if (prop === IS_SYNC_APPLY_FUN_MARKER) {
              return true;
            }
            return Reflect.get(fun, prop, r);
          },
          apply: (_target: Function, thisArg: any, argArray?: any) => {
            /// 要使用本地的promise对任务进行包裹，不然对方接下来会进入卡死状态。
            return new Promise((resolve, reject) => {
              send([EmscriptenReflect.AsyncApply, resolve, reject, thisArg, ...argArray], true);
            });
          },
        }) as BFChainComlink.SyncToAsync<T>;
      }
    }
    throw new TypeError();
  }
}
