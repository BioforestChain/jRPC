const enum STORE_TYPE {
  Object,
  Symbol,
}
type ObjectStoreItem = {
  id: number;
  type: STORE_TYPE.Object;
  obj: object;
  // hid?: number;
};
type SymbolStoreItem = {
  id: number;
  type: STORE_TYPE.Symbol;
  sym: symbol;
  // hid?: number;
};
type StoreItem = ObjectStoreItem | SymbolStoreItem;
import { EsmBuildInObjectKeyValueList } from "./const";

export class ExportStore {
  constructor(
    public readonly name: string,
    /** 共享内建对象 */
    public readonly isShareBuildIn: boolean,
  ) {
    if (isShareBuildIn) {
      for (const item of EsmBuildInObjectKeyValueList) {
        this.saveObjId(item[1], item[0]);
      }
    }
  }
  /**
   * 提供给远端的 refId|symId
   * 远端可以使用 locId 来进行访问本地
   *
   * 从1000开始，0~999留给内建对象
   * @WARN 如果类型是uint32，要注意溢出后从0开始累计时，需绕过0~999
   */
  accId = 1000;
  /**我所导出的引用对象与符号 */
  private objIdStore = new Map<number | object | symbol, StoreItem>();
  getObjById(id: number) {
    const cache = this.objIdStore.get(id);
    if (cache && cache.type === STORE_TYPE.Object) {
      return cache.obj;
    }
  }
  getSymById(id: number) {
    const cache = this.objIdStore.get(id);
    if (cache && cache.type === STORE_TYPE.Symbol) {
      return cache.sym;
    }
  }

  getId(obj: object | symbol) {
    const cache = this.objIdStore.get(obj);
    return cache?.id;
  }

  /**
   * 保存对象的引用
   */
  saveObjId(obj: object, id = this.accId++) {
    const cache: ObjectStoreItem = { type: STORE_TYPE.Object, obj, id };
    this.objIdStore.set(id, cache);
    this.objIdStore.set(obj, cache);
    return id;
  }
  /**
   * 保存符号
   */
  saveSymId(sym: symbol, id = this.accId++) {
    const cache: SymbolStoreItem = { type: STORE_TYPE.Symbol, sym, id };
    this.objIdStore.set(id, cache);
    this.objIdStore.set(sym, cache);
    return id;
  }
  /**
   * 释放对象的引用
   * @param id
   */
  releaseById(id: number) {
    // console.log("release", this.name, id);
    const cache = this.objIdStore.get(id);
    if (cache) {
      if (cache.type === STORE_TYPE.Object) {
        this.objIdStore.delete(cache.obj);
      } else {
        this.objIdStore.delete(cache.sym);
      }

      this.objIdStore.delete(id);
      return true;
    }
    return false;
  }

  exportSymbol(source: symbol) {
    return this.getId(source) ?? this.saveSymId(source);
  }
  exportObject(source: object) {
    return this.getId(source) ?? this.saveObjId(source);
  }
}
