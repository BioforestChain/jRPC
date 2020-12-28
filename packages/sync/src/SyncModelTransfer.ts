import {
  globalSymbolStore,
  IMPORT_FUN_EXTENDS_SYMBOL,
  IOB_EFT_Factory_Map,
  IOB_Extends_Function_ToString_Mode,
  IOB_Extends_Object_Status,
  IOB_Extends_Type,
  IOB_Type,
  ModelTransfer,
  refFunctionStaticToStringFactory,
} from "@bfchain/comlink-protocol";
import { EmscriptenReflect, LinkObjType } from "@bfchain/comlink-typings";
import { CallbackToSync } from "./helper";
import { PROTOCAL_SENDER } from "./const";
import type { ComlinkSync } from "./ComlinkSync";

export class SyncModelTransfer extends ModelTransfer<ComlinkSync> {
  constructor(core: ComlinkSync) {
    super(core);
  }

  /**
   * ref fun statis toString
   */
  private _rfsts = refFunctionStaticToStringFactory();
  private _genSender(port: BFChainComlink.BinaryPort<ComlinkProtocol.TB>, refId: number) {
    const send = <R = unknown>(linkIn: [EmscriptenReflect, ...unknown[]], hasOut: boolean) =>
      this._sendLinkIn<R>(port, refId, linkIn, hasOut);
    return send;
  }
  private _getDefaultProxyHanlder<T extends object>(
    send: ReturnType<SyncModelTransfer["_genSender"]>,
  ) {
    const proxyHandler: BFChainComlink.EmscriptionProxyHanlder<T> = {
      getPrototypeOf: (_target) => send<object | null>([EmscriptenReflect.GetPrototypeOf], true),
      setPrototypeOf: (_target, proto) =>
        send<boolean>([EmscriptenReflect.SetPrototypeOf, proto], true),
      isExtensible: (target) => send<boolean>([EmscriptenReflect.IsExtensible], true),
      preventExtensions: (_target) => send<boolean>([EmscriptenReflect.PreventExtensions], true),
      getOwnPropertyDescriptor: (_target, prop: PropertyKey) =>
        send<PropertyDescriptor | undefined>(
          [EmscriptenReflect.GetOwnPropertyDescriptor, prop],
          true,
        ),
      has: (_target, prop: PropertyKey) => send<boolean>([EmscriptenReflect.Has], true),
      /**导入子模块 */
      get: (_target, prop, _reciver) =>
        // console.log("get", prop),
        send<boolean>([EmscriptenReflect.Get, prop], true),
      /**发送 set 操作 */
      set: (_target, prop: PropertyKey, value: any, _receiver: any) => (
        send<boolean>([EmscriptenReflect.Set, prop, value], false), true
      ),
      deleteProperty: (_target, prop: PropertyKey) => (
        send([EmscriptenReflect.DeleteProperty, prop], false), true
      ),
      defineProperty: (_target, prop: PropertyKey, attr: PropertyDescriptor) => (
        send([EmscriptenReflect.DefineProperty, prop, attr], false), true
      ),
      ownKeys: (_target) => send([EmscriptenReflect.OwnKeys], true),
      apply: (_target, thisArg, argArray) =>
        send([EmscriptenReflect.Apply, thisArg, ...argArray], true),
      construct: (_target, argArray, newTarget) =>
        send([EmscriptenReflect.Construct, newTarget, ...argArray], true),
    };
    return proxyHandler;
  }

  private _sendLinkIn<R = unknown>(
    port: ComlinkProtocol.BinaryPort,
    targetId: number,
    linkIn: unknown[],
    hasOut: boolean,
  ) {
    const { transfer } = this.core;

    /// 执行请求
    const bin = CallbackToSync(
      port.req,
      [
        transfer.linkObj2TransferableBinary({
          type: LinkObjType.In,
          // reqId,
          targetId,
          in: linkIn.map((a) => CallbackToSync(transfer.Any2InOutBinary, [a], transfer)),
          hasOut,
        }),
      ],
      port,
    );

    /// 处理请求
    const linkObj = transfer.transferableBinary2LinkObj(bin);

    if (linkObj.type !== LinkObjType.Out) {
      throw new TypeError();
    }

    if (linkObj.isThrow) {
      const err_iob = linkObj.out.slice().pop();
      const err = err_iob && transfer.InOutBinary2Any(err_iob);
      throw err;
    }
    const res_iob = hasOut && linkObj.out.slice().pop();
    const res = res_iob && transfer.InOutBinary2Any(res_iob);
    return res as R;
  }

  /**
   * 主动生成引用代理
   * @param port
   * @param refId
   */
  private _createImportByRefId<T>(port: ComlinkProtocol.BinaryPort, refId: number) {
    const refHook = this._createImportRefHook<T>(port, refId);
    const source = refHook.getSource();
    if (refHook.type === "object") {
      const proxyHanlder = refHook.getProxyHanlder();
      const proxy = new Proxy(source as never, proxyHanlder);
      return proxy;
    }
    return source;
  }
  private _createImportRefHook<T>(
    port: ComlinkProtocol.BinaryPort,
    refId: number,
  ): BFChainComlink.ImportRefHook<T> {
    const refExtends = this.core.importStore.idExtendsStore.get(refId);
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

      const funRef: BFChainComlink.ImportRefHook<Function> = {
        type: "object",
        getSource: () => sourceFun,
        getProxyHanlder: () => {
          const send = this._genSender(port, refId);
          const defaultProxyHanlder = this._getDefaultProxyHanlder<Function>(send);
          const functionProxyHanlder: BFChainComlink.EmscriptionProxyHanlder<Function> = {
            ...defaultProxyHanlder,
            get: (target, prop, receiver) => {
              if (prop === "name") {
                return refExtends.name;
              }
              if (prop === "length") {
                return refExtends.length;
              }

              //#region 自定义属性

              /**
               * 本地模拟的toString，constructor和protoype等等属性都没有绑定远程
               * 这里纯粹是为了加速，模拟远端的返回，可以不用
               * @TODO 配置成可以可选模式
               */
              if (prop === IMPORT_FUN_EXTENDS_SYMBOL) {
                return refExtends;
              }
              if (prop === PROTOCAL_SENDER) {
                return send;
              }
              //#endregion
              //#region 静态的toString模式下的本地模拟

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
      };
      ref = (funRef as unknown) as BFChainComlink.ImportRefHook<T>;
    } else if (refExtends.type === IOB_Extends_Type.Object) {
      const sourceObj = {};
      const objRef: BFChainComlink.ImportRefHook<object> = {
        type: "object",
        getSource: () => sourceObj,
        getProxyHanlder: () => {
          const send = this._genSender(port, refId);
          const defaultProxyHanlder = this._getDefaultProxyHanlder<object>(send);
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

  InOutBinary2Any(bin: ComlinkProtocol.IOB): unknown {
    const { port, importStore, exportStore } = this.core;
    switch (bin.type) {
      //   case LinkItemType.Default:
      //     return defaultCtx;
      case IOB_Type.Locale:
        const loc = exportStore.getObjById(bin.locId) || exportStore.getSymById(bin.locId);
        if (!loc) {
          throw new ReferenceError();
        }
        return loc;
      case IOB_Type.Ref:
      case IOB_Type.RemoteSymbol:
        /// 读取缓存中的应用对象
        let cachedProxy = importStore.getProxyById(bin.refId);
        if (cachedProxy === undefined) {
          // 保存引用信息
          importStore.idExtendsStore.set(bin.refId, bin.extends);
          /// 使用导入功能生成对象
          cachedProxy = this._createImportByRefId<symbol | Object>(port, bin.refId);
          /// 缓存对象
          importStore.saveProxyId(cachedProxy, bin.refId);
        }
        return cachedProxy;
      case IOB_Type.Clone:
        return bin.data;
    }
    throw new TypeError();
  }
}
