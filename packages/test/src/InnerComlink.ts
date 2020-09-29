import { ComlinkCore, ImportStore } from "@bfchain/comlink-core";
import { IOB_Type, globalSymbolStore } from "./const";

export class InnerComlink extends ComlinkCore<
  InnerComlink.IOB,
  InnerComlink.TB,
  InnerComlink.IOB_E
> {
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
      const imp = this.importStore.getProxy(obj as object);
      if (imp) {
        item = {
          type: IOB_Type.Locale,
          locId: imp.id,
        };
      }
      /// 符号对象需要在远端做一个克隆备份
      else {
        switch (typeof obj) {
          case "symbol":
            item = {
              type: IOB_Type.RemoteSymbol,
              refId: this._exportSymbol(obj),
              extends: this._getRemoteSymbolItemExtends(obj),
            };
            break;
          case "function":
          case "object":
            if (obj !== null) {
              item = {
                type: IOB_Type.Ref,
                refId: this._exportObject(obj),
                extends: this._getRefItemExtends(obj),
              };
            }
        }
      }
    }
    if (!item) {
      throw new TypeError("Cloud not transfer to IOB");
    }

    return item;
  }
  InOutBinary2Any(
    port: InnerComlink.BinaryPort,
    bin: InnerComlink.IOB
  ): unknown {
    switch (bin.type) {
      //   case LinkItemType.Default:
      //     return defaultCtx;
      case IOB_Type.Locale:
        const loc =
          this.exportStore.getObjById(bin.locId) ||
          this.exportStore.getSymById(bin.locId);
        if (!loc) {
          throw new ReferenceError();
        }
        return loc;
      case IOB_Type.Ref:
      case IOB_Type.RemoteSymbol:
        /// 读取缓存中的应用对象
        let cachedProxy = this.importStore.getProxyById(bin.refId);
        if (cachedProxy === undefined) {
          // 保存引用信息
          this.importStore.idExtendsStore.set(bin.refId, bin.extends);
          /// 使用导入功能生成对象
          cachedProxy = this._createImportByRefId<symbol | Object>(
            port,
            bin.refId
          );
          /// 缓存对象
          this.importStore.saveProxyId(cachedProxy, bin.refId);
        }
        return cachedProxy;
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
    const globalSymInfo = globalSymbolStore.get(sym);
    if (globalSymInfo) {
      return {
        type: "symbol",
        global: true,
        description: globalSymInfo.name,
        unique: false,
      };
    }
    return {
      type: "symbol",
      global: false,
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
      const code_funName = refExtends.name;
      const code_asyncPrefix = refExtends.isAsync
        ? "async " /* 这里要确保引擎级别是匹配的 */
        : "";
      const code_paramList = Array.from(
        { length: refExtends.length },
        (_, i) => `_${i}`
      );

      const sourceCode = code_funName
        ? `const funContainer={${code_asyncPrefix}${code_funName}(${code_paramList}) {}};
      for(const key in funContainer){return funContainer[key]};
      return funContainer[Object.getOwnPropertySymbols(funContainer)[0]]`
        : `return ${code_asyncPrefix}function (${code_paramList}){}`;
      const sourceFun = Function(sourceCode)();
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
        getSource: () => sourceSym,
      };
      ref = (symRef as unknown) as BFChainComlink.ImportRefHook<T>;
    }
    if (!ref) {
      throw new TypeError();
    }
    return ref;
  }

  import<T>(port: InnerComlink.BinaryPort, key?: string) {
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
