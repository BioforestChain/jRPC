import type { ComlinkCore } from "@bfchain/comlink-core";
import {
  IOB_Type,
  globalSymbolStore,
  IOB_Extends_Type,
  IOB_EFT_Factory_Map,
  getFunctionType,
  getObjectStatus,
  IOB_Extends_Function_ToString_Mode,
  getFunctionExportDescription,
} from "./const";

export class ModelTransfer
  implements BFChainComlink.ModelTransfer<ComlinkProtocol.IOB, ComlinkProtocol.TB> {
  constructor(
    private core: ComlinkCore<ComlinkProtocol.IOB, ComlinkProtocol.TB, ComlinkProtocol.IOB_E>,
  ) {}
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

  Any2InOutBinary(obj: unknown): ComlinkProtocol.IOB {
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
          cachedProxy = this.core.createImportByRefId<symbol | Object>(port, bin.refId);
          /// 缓存对象
          importStore.saveProxyId(cachedProxy, bin.refId);
        }
        return cachedProxy;
      case IOB_Type.Clone:
        return bin.data;
    }
    throw new TypeError();
  }

  linkObj2TransferableBinary(obj: ComlinkProtocol.LinkObj) {
    return obj as ComlinkProtocol.TB;
  }
  transferableBinary2LinkObj(bin: ComlinkProtocol.TB) {
    return bin as ComlinkProtocol.LinkObj;
  }
}
