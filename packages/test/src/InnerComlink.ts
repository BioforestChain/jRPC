import { ComlinkCore, ImportStore } from "@bfchain/comlink-core";
import { IOB_Type } from "./const";

const OBJECT_PROPERTY: object = Object.prototype;

export class InnerComlink extends ComlinkCore<
  InnerComlink.IOB,
  InnerComlink.TB
> {
  constructor(private name: string) {
    super();
  }

  Any2InOutBinary(obj: unknown): InnerComlink.IOB {
    const needClone = this.canClone(obj);
    let item: InnerComlink.IOB | undefined;
    /// 可直接通过赋值而克隆的对象
    if (needClone) {
      item = {
        type: IOB_Type.Clone,
        data: obj,
      };
    } else {
      /// 对象是否是导入进来的
      const imp = this.importStore.proxyIdStore.get(obj as object);
      if (imp) {
        item = {
          type: IOB_Type.Locale,
          locId: imp.id,
        };
      }
      /// 符号对象需要在远端做一个克隆备份
      else if (typeof obj === "symbol") {
        item = {
          type: IOB_Type.RemoteSymbol,
          refId: this._exportSymbol(obj),
          extends: this._getRemoteSymbolItemExtends(obj),
        };
      }
      /// 本地无法克隆的对象，直接提供引用
      else if (
        /* object|function */ obj instanceof Object ||
        OBJECT_PROPERTY === obj
      ) {
        item = {
          type: IOB_Type.Ref,
          refId: this._exportObject(obj),
          extends: this._getRefItemExtends(obj),
        };
      }
    }
    if (!item) {
      throw new TypeError("Cloud not transfer to IOB");
    }

    return item;
  }
  protected importStore = new ImportStore<InnerComlink.IOB_E>();
  InOutBinary2Any(
    port: InnerComlink.BinaryPort,
    bin: InnerComlink.IOB
  ): unknown {
    switch (bin.type) {
      //   case LinkItemType.Default:
      //     return defaultCtx;
      case IOB_Type.Locale:
        const exported = this.exportStore.objIdStore.get(bin.locId);
        if (!exported) {
          throw new ReferenceError();
        }
        return exported.obj;
      case IOB_Type.Ref:
      case IOB_Type.RemoteSymbol:
        /// 读取缓存中的应用对象
        let refCache = this.importStore.proxyIdStore.get(bin.refId);
        if (!refCache) {
          // 保存引用信息
          this.importStore.idExtendsStore.set(bin.refId, bin.extends);
          /// 使用导入功能生成对象
          const ref = this._importByRefId<symbol | Object>(port, bin.refId);
          refCache = {
            id: bin.refId,
            proxy: ref,
          };
          /// 缓存对象
          this.importStore.proxyIdStore.set(refCache.id, refCache);
          this.importStore.proxyIdStore.set(refCache.proxy, refCache);
        }
        return refCache.proxy;
      case IOB_Type.Clone:
        return bin.data;
    }
    throw new TypeError();
  }

  linkObj2TransferableBinary(obj: InnerComlink.LinkObj) {
    return obj as InnerComlink.TB;
  }
  transferableBinary2LinkObj(bin: InnerComlink.TB) {
    return bin as InnerComlink.LinkObj;
  }

  private _getRefItemExtends(
    obj: object | Function
  ): EmscriptionLinkRefExtends.RefItemExtends {
    if (typeof obj === "object") {
      return {
        type: "object",
        hasThen: obj !== null && "then" in obj,
      };
    }
    if (typeof obj === "function") {
      return {
        type: "function",
        isAsync: this._isAsyncFunction(obj),
        name: obj.name,
        length: obj.length,
      };
    }
    throw new TypeError();
  }
  private _getRemoteSymbolItemExtends(
    sym: symbol
  ): EmscriptionLinkRefExtends.RemoteSymbolItemExtends {
    return {
      type: "symbol",
      description:
        Object.getOwnPropertyDescriptor(sym, "description")?.value ??
        sym.toString().slice(7, -1),
      unique: Symbol.keyFor(sym) !== undefined,
    };
  }

  private _isAsyncFunction(fun: Function): boolean {
    try {
      const AsyncFunctionConstructor = Function(
        "return (async()=>{}).constructor"
      )();
      this._isAsyncFunction = (fun: Function) =>
        fun instanceof AsyncFunctionConstructor;
    } catch {
      this._isAsyncFunction = () => false;
    }

    return this._isAsyncFunction(fun);
  }

  canClone(obj: unknown) {
    switch (typeof obj) {
      case "bigint":
      case "boolean":
      case "number":
      case "string":
      case "undefined":
        return true;
      case "symbol":
      // return Symbol.keyFor(obj) !== undefined;
      case "function":
        return false;
      case "object":
        return obj === null;
    }
    return false;
  }

  protected _beforeImportRef<T>(
    port: InnerComlink.BinaryPort,
    refId: number
  ): BFChainComlink.ImportRefHook<T> {
    const refExtends = this.importStore.idExtendsStore.get(refId);
    if (!refExtends) {
      throw new ReferenceError();
    }
    let ref: BFChainComlink.ImportRefHook<T> | undefined;
    if (refExtends.type === "function") {
      const sourceFun = Function(
        `return ${
          refExtends.isAsync ? "async" /* 这里要确保引擎级别是匹配的 */ : ""
        } function ${refExtends.name}(${Array.from(
          { length: refExtends.length },
          (_, i) => `_${i}`
        )}){}`
      )();
      const funRef: BFChainComlink.ImportRefHook<Function> = {
        getSource: () => sourceFun,
        getProxyHanlder: () => {
          const defaultProxyHanlder = this._getDefaultProxyHanlder<Function>(
            port,
            refId
          );
          const functionProxyHanlder: BFChainComlink.EmscriptionProxyHanlder<Function> = {
            ...defaultProxyHanlder,
            get(target, prop, receiver) {
              if (prop === "call") {
                return new Proxy(sourceFun[prop], {
                  apply(_, thisArg, argArray) {
                    return defaultProxyHanlder.apply(
                      sourceFun,
                      argArray[0],
                      argArray.slice(1)
                    );
                  },
                });
              } else if (prop === "apply") {
                return new Proxy(sourceFun[prop], {
                  apply(_, thisArg, argArray) {
                    return defaultProxyHanlder.apply(
                      sourceFun,
                      argArray[0],
                      argArray[1]
                    );
                  },
                });
              }
              return defaultProxyHanlder.get(target, prop, receiver);
            },
          };
          return functionProxyHanlder;
        },
      };
      ref = (funRef as unknown) as BFChainComlink.ImportRefHook<T>;
    } else if (refExtends.type === "object") {
      const sourceObj = {};
      const objRef: BFChainComlink.ImportRefHook<object> = {
        getSource: () => sourceObj,
        getProxyHanlder: () => {
          const defaultProxyHanlder = this._getDefaultProxyHanlder<object>(
            port,
            refId
          );
          const functionProxyHanlder: BFChainComlink.EmscriptionProxyHanlder<Function> = {
            ...defaultProxyHanlder,
            get(target, prop, receiver) {
              if (prop === "then") {
                if (refExtends.hasThen === false) {
                  return undefined;
                }
              }
              return defaultProxyHanlder.get(target, prop, receiver);
            },
          };
          return functionProxyHanlder;
        },
      };
      ref = (objRef as unknown) as BFChainComlink.ImportRefHook<T>;
    } else if (refExtends.type === "symbol") {
      const sourceSym = refExtends.unique
        ? Symbol.for(refExtends.description)
        : Symbol(refExtends.description);
      const symRef: BFChainComlink.ImportRefHook<symbol> = {
        getSource: () => sourceSym,
      };
      ref = (symRef as unknown) as BFChainComlink.ImportRefHook<T>;
    }
    if (!ref) {
      throw new TypeError();
    }
    return ref;
  }

  import<T extends object>(port: InnerComlink.BinaryPort, key?: string) {
    /**模拟收到头部的数据交换了 */
    this.InOutBinary2Any(port, {
      type: IOB_Type.Ref,
      refId: 0,
      extends: { type: "object", hasThen: false },
    });
    /// 执行原有的import流程
    return super.import<T>(port, key);
  }
}
