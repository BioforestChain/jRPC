import { ComlinkCore, STORE_TYPE, helper } from "@bfchain/comlink-core";
import { EmscriptenReflect, isObj } from "@bfchain/comlink-typings";
import { ReflectAsync } from "./ReflectAsync";
import { createAsyncValueProxyHanlder } from "./AsyncValueProxy";
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

export class ComlinkAsync
  extends ComlinkCore<ComlinkProtocol.IOB, ComlinkProtocol.TB, ComlinkProtocol.IOB_E>
  implements BFChainComlink.ComlinkAsync {
  constructor(port: ComlinkProtocol.BinaryPort, name: string) {
    super(port, name);
  }
  wrap<T>(val: BFChainComlink.ReflectAsync<T>): BFChainComlink.AsyncUtil.Remote<T> {
    throw new Error("Method not implemented.");
  }
  readonly transfer: BFChainComlink.ModelTransfer<
    ComlinkProtocol.IOB,
    ComlinkProtocol.TB
  > = new ModelTransfer(this);

  /**
   * ref fun statis toString
   */
  private _rfsts = refFunctionStaticToStringFactory();

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

  protected $beforeImportRef<T>(
    port: ComlinkProtocol.BinaryPort,
    refId: number,
  ): BFChainComlink.ImportRefHook<T> {
    const refExtends = this.importStore.idExtendsStore.get(refId);
    if (!refExtends) {
      throw new ReferenceError();
    }
    let ref: BFChainComlink.ImportRefHook<T> | undefined;
    if (refExtends.type === IOB_Extends_Type.Function) {
      const factory = IOB_EFT_Factory_Map.get(refExtends.funType);
      if (!factory) {
        throw new TypeError();
      }

      const sourceFun = factory.factory();
      const asyncReflectValue = this.$getReflectAsync<Function>(port, refId);
      const defaultProxyHanlder = createAsyncValueProxyHanlder(asyncReflectValue, sourceFun, {
        get target() {
          return asyncReflectValue.source;
        },
        paths: [`<refFun[${refId}]::${refExtends.name}>`],
      });

      const funRef: BFChainComlink.ImportRefHook<Function> = {
        type: "object",
        getSource: () => sourceFun,
        getProxyHanlder: () => {
          const functionProxyHanlder: BFChainComlink.EmscriptionProxyHanlder<Function> = {
            ...defaultProxyHanlder,
            get: (target, prop, receiver) => {
              if (prop === "name") {
                return refExtends.name;
              }
              if (prop === "length") {
                return refExtends.length;
              }

              //#region 静态的toString模式下的本地模拟
              /**
               * 本地模拟的toString，constructor和protoype等等属性都没有绑定远程
               * 这里纯粹是为了加速，模拟远端的返回，可以不用
               * @TODO 配置成可以可选模式
               */
              if (prop === IMPORT_FUN_EXTENDS_SYMBOL) {
                return refExtends;
              }
              if (
                prop === "toString" &&
                refExtends.toString.mode === IOB_Extends_Function_ToString_Mode.static
              ) {
                return this._rfsts;
              }
              //#endregion

              return defaultProxyHanlder.get(target, prop, receiver);
            },
          };
          return functionProxyHanlder;
        },
        onProxyCreated: (proxy) => {
          asyncReflectValue.source = proxy;
        },
      };
      ref = (funRef as unknown) as BFChainComlink.ImportRefHook<T>;
    } else if (refExtends.type === IOB_Extends_Type.Object) {
      const sourceObj = { __comlink_async_remote__: true };
      const asyncReflectValue = this.$getReflectAsync<object>(port, refId);
      const defaultProxyHanlder = createAsyncValueProxyHanlder(asyncReflectValue, sourceObj, {
        get target() {
          return asyncReflectValue.source;
        },
        paths: [`<refObj[${refId}]>`],
      });
      const objRef: BFChainComlink.ImportRefHook<object> = {
        type: "object",
        getSource: () => sourceObj,
        getProxyHanlder: () => {
          /**
           * 因为对象一旦被设置状态后，无法回退，所以这里可以直接根据现有的状态来判断对象的可操作性
           * @TODO 使用isExtensible isFrozen isSealed来改进
           */
          const functionProxyHanlder: BFChainComlink.EmscriptionProxyHanlder<Function> = {
            ...defaultProxyHanlder,
            set(target, prop, value, receiver) {
              /**目前如果要实现判断是insert还是update，就要基于已经知道有多少的属性来推断，这方面还需要考虑 ArrayLike 的优化
               * 这一切可能要做成缓存的模式，缓存被禁止的属性
               * @TODO 如果是 不能add 当 可以update 的模式，就要收集哪些是不能add的，之后就要直接在本地禁止
               */
              if ((refExtends.status & IOB_Extends_Object_Status.update) === 0) {
                return false;
              }
              return defaultProxyHanlder.set(target, prop, value, receiver);
            },
            deleteProperty(target, prop) {
              if ((refExtends.status & IOB_Extends_Object_Status.delete) !== 0) {
                return defaultProxyHanlder.deleteProperty(target, prop);
              }
              return false;
            },
          };
          return functionProxyHanlder;
        },
        onProxyCreated: (proxy) => {
          asyncReflectValue.source = proxy;
        },
      };
      ref = (objRef as unknown) as BFChainComlink.ImportRefHook<T>;
    } else if (refExtends.type === IOB_Extends_Type.Symbol) {
      let sourceSym: symbol;
      if (refExtends.global) {
        const globalSymInfo = globalSymbolStore.get(refExtends.description);
        if (!globalSymInfo) {
          throw new TypeError();
        }
        sourceSym = globalSymInfo.sym;
      } else {
        sourceSym = refExtends.unique
          ? Symbol.for(refExtends.description)
          : Symbol(refExtends.description);
      }
      const symRef: BFChainComlink.ImportRefHook<symbol> = {
        type: "primitive",
        getSource: () => sourceSym,
      };
      ref = (symRef as unknown) as BFChainComlink.ImportRefHook<T>;
    }
    if (!ref) {
      throw new TypeError();
    }
    return ref;
  }
  protected $getReflectAsync<T extends object>(
    port: BFChainComlink.BinaryPort<ComlinkProtocol.TB>,
    refId: number,
    proxy?: T,
  ): BFChainComlink.ReflectAsync<T> {
    const send = async <R extends BFChainComlink.AsyncValue<unknown>>(
      cb: BFChainComlink.Callback<R>,
      linkIn: [EmscriptenReflect, ...unknown[]],
      hasOut: boolean,
    ) =>
      this.$sendLinkIn(
        (ret) => {
          try {
            type RO = R & object;
            const proxyMaybe = helper.OpenArg(ret);
            let res: R | Promise<RO> = proxyMaybe as R;
            if (isObj(proxyMaybe)) {
              const storeItem = this.importStore.getProxy(proxyMaybe);
              if (storeItem && storeItem.type === STORE_TYPE.Proxy) {
                // 要将proxy对象与asyncReflect对象进行关联，否则proxy对象会被垃圾回收引起远端释放引用
                res = (this.$getReflectAsync(
                  port,
                  storeItem.id,
                  proxyMaybe as RO,
                ) as unknown) as RO;
              }
            }
            cb({ isError: false, data: res });
          } catch (err) {
            cb({ isError: true, error: err });
          }
        },
        port,
        refId,
        linkIn,
        hasOut,
      );

    const asyncReflectValue = new ReflectAsync<T>(send, proxy);

    return asyncReflectValue;
  }
  import<T>(key = "default") {
    return CallbackToAsync(this.$import, [key], this) as Promise<
      BFChainComlink.AsyncUtil.Remote<T>
    >;
  }
}
