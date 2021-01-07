import { ComlinkCore, helper } from "@bfchain/comlink-core";
import {
  IOB_Type,
  globalSymbolStore,
  IOB_Extends_Type,
  IOB_EFT_Factory_Map,
  getFunctionType,
  getObjectStatus,
  IOB_Extends_Function_ToString_Mode,
  getFunctionExportDescription,
  IOB_Extends_Function_Type,
} from "./const";

export abstract class ModelTransfer<
  Core extends ComlinkCore<ComlinkProtocol.IOB, ComlinkProtocol.TB, ComlinkProtocol.IOB_E>
> implements BFChainComlink.ModelTransfer<ComlinkProtocol.IOB, ComlinkProtocol.TB> {
  constructor(protected core: Core) {}

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

  /**获取一个引用对象的扩展信息 */
  private _getRefItemExtends(obj: object | Function): EmscriptionLinkRefExtends.RefItemExtends {
    if (typeof obj === "object") {
      return {
        type: IOB_Extends_Type.Object,
        status: getObjectStatus(obj),
      };
    }
    if (typeof obj === "function") {
      const exportDescriptor = getFunctionExportDescription(obj);
      const funType = getFunctionType(obj);
      /**
       * @FIXME 这种判断也是有风险的，因为虽然箭头函数等严格模式不允许执行 `fun.caller = 1`，但因为`caller`并不在属性里，而是在原型链上进行约束的，所以可能会使用`Reflect.set(fun,'caller',1)`从而达成混淆的效果
       */
      const isStatic = Object.getOwnPropertyDescriptor(obj, "caller") === undefined;
      return {
        type: IOB_Extends_Type.Function,
        funType,
        name: obj.name,
        length: obj.length,
        isStatic,
        status: getObjectStatus(obj),
        instanceOfFunction: obj instanceof Function,
        canConstruct:
          funType === IOB_Extends_Function_Type.Class ||
          (funType === IOB_Extends_Function_Type.Sync && isStatic === false),
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

  Any2InOutBinary(cb: BFChainComlink.Callback<ComlinkProtocol.IOB>, obj: unknown) {
    helper.SyncForCallback(cb, () => {
      const needClone = this.canClone(obj);
      let item: ComlinkProtocol.IOB | undefined;
      /// 可直接通过赋值而克隆的对象
      if (needClone) {
        item = {
          type: IOB_Type.Clone,
          data: obj,
        };
      } else {
        /// 对象是否是导入进来的
        const imp = this.core.importStore.getProxy(obj as object);
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
                refId: this.core.exportStore.exportSymbol(obj),
                extends: this._getRemoteSymbolItemExtends(obj),
              };
              break;
            case "function":
            case "object":
              if (obj !== null) {
                item = {
                  type: IOB_Type.Ref,
                  refId: this.core.exportStore.exportObject(obj),
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
    });
  }
  abstract InOutBinary2Any(bin: ComlinkProtocol.IOB): unknown;

  linkObj2TransferableBinary(obj: ComlinkProtocol.LinkObj) {
    return obj as ComlinkProtocol.TB;
  }
  transferableBinary2LinkObj(bin: ComlinkProtocol.TB) {
    return bin as ComlinkProtocol.LinkObj;
  }
}
