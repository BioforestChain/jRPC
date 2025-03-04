import { ComlinkCore, ExportStore, ImportStore, STORE_TYPE } from "@bfchain/link-core";
import {
  getFunctionExportDescription,
  IOB_EFT_Factory_Map,
  getFunctionType,
} from "@bfchain/link-protocol";
import { EmscriptenReflect } from "@bfchain/link-typings";
import { CallbackToSync } from "./helper";
import { PROTOCAL_SENDER, IS_ASYNC_APPLY_FUN_MARKER, IS_SYNC_APPLY_FUN_MARKER } from "./const";
import { SyncModelTransfer } from "./SyncModelTransfer";

export class ComlinkSync
  extends ComlinkCore<ComlinkProtocol.IOB, ComlinkProtocol.TB, ComlinkProtocol.IOB_E>
  implements BFChainLink.ComlinkSync {
  constructor(port: ComlinkProtocol.BinaryPort, name: string, isShareBuildIn: boolean) {
    super(port, name, isShareBuildIn);
  }
  push(obj: object, transfer?: object[]) {
    return CallbackToSync(this.$pushToRemote, [obj, transfer], this);
  }

  readonly transfer = new SyncModelTransfer(this);
  readonly exportStore = new ExportStore(this.name, this.isShareBuildIn);
  readonly importStore = new ImportStore<
    ComlinkProtocol.IOB,
    ComlinkProtocol.TB,
    ComlinkProtocol.IOB_E
  >(this.name, this.port, this.transfer, this.isShareBuildIn);

  // /**
  //  * ref fun statis toString
  //  */
  // private _rfsts = refFunctionStaticToStringFactory();

  protected $getEsmReflectHanlder(opeartor: EmscriptenReflect) {
    const hanlder = super.$getEsmReflectHanlder(opeartor);
    if (opeartor === EmscriptenReflect.Apply || opeartor === EmscriptenReflect.UnpromisifyApply) {
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

  import<T>(key = "default") {
    const importModule = CallbackToSync(this.$getImportModule, [], this);
    return Reflect.get(importModule, key) as T;
  }
  importAsSync<T>(key = "default") {
    return this.asyncToSync(this.import<T>(key));
  }
  private _syncWM = new WeakMap();
  asyncToSync<T>(fun: T) {
    if (typeof fun !== "function") {
      throw new TypeError();
    }
    if (Reflect.get(fun, IS_ASYNC_APPLY_FUN_MARKER)) {
      return fun as BFChainLink.AsyncToSync<T>;
    }

    let syncFun = this._syncWM.get(fun) as BFChainLink.AsyncToSync<T> | undefined;
    if (!syncFun) {
      const sender = this.transfer.getLinkInSenderByProxy(fun);
      if (!sender) {
        throw new TypeError();
      }
      syncFun = new Proxy(fun, {
        get(_target, prop, r) {
          if (prop === IS_ASYNC_APPLY_FUN_MARKER) {
            return true;
          }
          return Reflect.get(fun, prop, r);
        },
        apply: (_target: Function, thisArg: any, argArray?: any) => {
          return sender.req([EmscriptenReflect.UnpromisifyApply, thisArg, ...argArray]);
        },
      }) as BFChainLink.AsyncToSync<T>;

      this.importStore.backupProxyId(syncFun as Function, this.importStore.getProxy(fun)!.id);
      this._syncWM.set(fun, syncFun);
    }
    return syncFun;
  }
  importAsAsync<T>(key = "default") {
    return this.syncToAsync(this.import<T>(key));
  }
  private _asyncWM = new WeakMap();
  syncToAsync<T>(fun: T) {
    if (typeof fun !== "function") {
      throw new TypeError();
    }
    if (Reflect.get(fun, IS_SYNC_APPLY_FUN_MARKER)) {
      return fun as BFChainLink.SyncToAsync<T>;
    }
    let asyncFun = this._asyncWM.get(fun) as BFChainLink.SyncToAsync<T> | undefined;
    if (!asyncFun) {
      const sender = this.transfer.getLinkInSenderByProxy(fun);
      if (!sender) {
        throw new TypeError();
      }
      asyncFun = new Proxy(fun, {
        get(_target, prop, r) {
          if (prop === IS_SYNC_APPLY_FUN_MARKER) {
            return true;
          }
          return Reflect.get(fun, prop, r);
        },
        apply: (_target: Function, thisArg: any, argArray?: any) => {
          /// 要使用本地的promise对任务进行包裹，不然对方接下来会进入卡死状态。
          return new Promise((resolve, reject) => {
            /* 无需返回值，所以走 .send ，这个是异步的，不会造成阻塞 */
            sender.sendNoBlock([
              EmscriptenReflect.AsyncApply,
              resolve,
              reject,
              thisArg,
              ...argArray,
            ]);
          });
        },
      }) as BFChainLink.SyncToAsync<T>;

      this.importStore.backupProxyId(asyncFun as Function, this.importStore.getProxy(fun)!.id);
      this._asyncWM.set(fun, asyncFun);
    }
    return asyncFun;
  }

  JSON_stringify(target: unknown) {
    const proxyHandler = this.transfer.getRefProxyHanlder(target);
    if (proxyHandler) {
      return proxyHandler.jsonStringify(target as never);
    }
    return JSON.stringify(target);
  }
}
