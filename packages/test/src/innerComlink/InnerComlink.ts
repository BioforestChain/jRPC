import { ComlinkCore, ImportStore } from "@bfchain/comlink-core";
import { EmscriptenReflect } from "@bfchain/comlink-typings";
import {
  IOB_Type,
  globalSymbolStore,
  IOB_Extends_Type,
  EXPORT_FUN_DESCRIPTOR_SYMBOL,
  IOB_EFT_Factory_Map,
  getFunctionType,
  getObjectStatus,
  IOB_Extends_Object_Status,
  IMPORT_FUN_EXTENDS_SYMBOL,
  refFunctionStaticToStringFactory,
  IOB_Extends_Function_ToString_Mode,
} from "./const";

export class InnerComlink extends ComlinkCore<
  InnerComlink.IOB,
  InnerComlink.TB,
  InnerComlink.IOB_E
> {
  constructor(port: InnerComlink.BinaryPort, name: string) {
    super(port, name);
  }

  /**
   * ref fun statis toString
   */
  private _rfsts = refFunctionStaticToStringFactory();

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
              refId: this.$exportSymbol(obj),
              extends: this._getRemoteSymbolItemExtends(obj),
            };
            break;
          case "function":
          case "object":
            if (obj !== null) {
              item = {
                type: IOB_Type.Ref,
                refId: this.$exportObject(obj),
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
  InOutBinary2Any(bin: InnerComlink.IOB): unknown {
    const { port, importStore, exportStore } = this;
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
          cachedProxy = this.$createImportByRefId<symbol | Object>(port, bin.refId);
          /// 缓存对象
          importStore.saveProxyId(cachedProxy, bin.refId);
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

  protected $getEsmReflectHanlder(opeartor: EmscriptenReflect) {
    const hanlder = super.$getEsmReflectHanlder(opeartor);
    if (opeartor === EmscriptenReflect.Apply) {
      const applyHanlder = (((target: Function, args: unknown[]) => {
        if (target === Function.prototype.toString) {
          const ctx = args[0] as Function;
          const exportDescriptor = this._getFunExpDes(ctx);
          /// 保护源码
          if (!exportDescriptor.showSourceCode) {
            console.log("get to string from remote");
            return IOB_EFT_Factory_Map.get(getFunctionType(ctx))!.toString({ name: ctx.name });
          }
        }
        return hanlder(target, args);
      }) as unknown) as typeof hanlder;
      return applyHanlder;
    }
    return hanlder;
  }

  /**获取一个对象的描述信息 */
  private _getFunExpDes(fun: Function) {
    return (Reflect.get(fun, EXPORT_FUN_DESCRIPTOR_SYMBOL) ||
      {}) as EmscriptionLinkRefExtends.FunctionExportDescriptor;
  }
  /**获取一个引用对象的扩展信息 */
  private _getRefItemExtends(obj: object | Function): EmscriptionLinkRefExtends.RefItemExtends {
    if (typeof obj === "object") {
      return {
        type: IOB_Extends_Type.Object,
        status: getObjectStatus(obj),
      };
    }
    if (typeof obj === "function") {
      const exportDescriptor = this._getFunExpDes(obj);
      const funType = getFunctionType(obj);
      return {
        type: IOB_Extends_Type.Function,
        funType,
        name: obj.name,
        length: obj.length,
        toString:
          obj.toString === Function.prototype.toString
            ? {
                mode: IOB_Extends_Function_ToString_Mode.static,
                code: exportDescriptor.showSourceCode
                  ? obj.toString()
                  : IOB_EFT_Factory_Map.get(funType)!.toString(obj),
              }
            : { mode: IOB_Extends_Function_ToString_Mode.dynamic },
      };
    }
    throw new TypeError();
  }

  /**获取符号的扩展信息 */
  private _getRemoteSymbolItemExtends(
    sym: symbol,
  ): EmscriptionLinkRefExtends.RemoteSymbolItemExtends {
    const globalSymInfo = globalSymbolStore.get(sym);
    if (globalSymInfo) {
      return {
        type: IOB_Extends_Type.Symbol,
        global: true,
        description: globalSymInfo.name,
        unique: false,
      };
    }
    return {
      type: IOB_Extends_Type.Symbol,
      global: false,
      description:
        Object.getOwnPropertyDescriptor(sym, "description")?.value ?? sym.toString().slice(7, -1),
      unique: Symbol.keyFor(sym) !== undefined,
    };
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

  protected $beforeImportRef<T>(
    port: InnerComlink.BinaryPort,
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

      const funRef: BFChainComlink.ImportRefHook<Function> = {
        getSource: () => sourceFun,
        getProxyHanlder: () => {
          const defaultProxyHanlder = this.$getDefaultProxyHanlder<Function>(port, refId);
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
      };
      ref = (funRef as unknown) as BFChainComlink.ImportRefHook<T>;
    } else if (refExtends.type === IOB_Extends_Type.Object) {
      const sourceObj = {};
      const objRef: BFChainComlink.ImportRefHook<object> = {
        getSource: () => sourceObj,
        getProxyHanlder: () => {
          const defaultProxyHanlder = this.$getDefaultProxyHanlder<object>(port, refId);
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
        getSource: () => sourceSym,
      };
      ref = (symRef as unknown) as BFChainComlink.ImportRefHook<T>;
    }
    if (!ref) {
      throw new TypeError();
    }
    return ref;
  }
}
