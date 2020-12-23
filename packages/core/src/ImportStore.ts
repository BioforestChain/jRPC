export const enum STORE_TYPE {
  Proxy,
  Symbol,
}
type ProxyStoreItem = {
  id: number;
  type: STORE_TYPE.Proxy;
  pwr: WeakRef<object>;
};
type SymbolStoreItem = {
  id: number;
  type: STORE_TYPE.Symbol;
  sym: symbol;
};
type StoreItem = ProxyStoreItem | SymbolStoreItem;

export class ImportStore<E = unknown> {
  constructor(public readonly name: string) {}
  /**存储协议扩展信息 */
  idExtendsStore = new Map<number, E>();
  /**我所导入的引用对象与符号 */
  private proxyIdStore = new Map<number | /* object | */ symbol, StoreItem>();
  private proxyIdWM = new WeakMap<object, number>();
  /**
   * 获取代理对象背后真正的引用信息
   */
  getProxy(proxy: unknown) {
    let cache: StoreItem | undefined;
    switch (typeof proxy) {
      case "number":
      case "symbol":
        cache = this.proxyIdStore.get(proxy);
        break;
      case "object":
        if (proxy === null) {
          return;
        }
      case "function":
        const id = this.proxyIdWM.get(proxy);
        if (id !== undefined) {
          cache = this.proxyIdStore.get(id);
        }
        break;
    }
    return cache;
  }
  isProxy(proxy: unknown) {
    switch (typeof proxy) {
      case "symbol":
        return this.proxyIdStore.has(proxy);
      case "object":
        if (proxy === null) {
          return false;
        }
      case "function":
        return this.proxyIdWM.has(proxy);
    }
    return false;
  }
  getProxyById<FORCE_TYPE = symbol | object>(id: number) {
    const cache = this.proxyIdStore.get(id);
    let res: object | symbol | undefined;
    if (cache) {
      if (cache.type === STORE_TYPE.Proxy) {
        res = cache.pwr.deref();
      } else {
        res = cache.sym;
      }
    }
    return res as FORCE_TYPE | undefined;
  }
  /**
   * 保存导入引用
   * @param proxy Proxy<object>|remote-symbol-placeholder
   * @param id refId
   */
  saveProxyId(proxy: object | symbol, id: number) {
    let cache: StoreItem;
    if (typeof proxy === "symbol") {
      cache = {
        id,
        type: STORE_TYPE.Symbol,
        sym: proxy,
      };
      this.proxyIdStore.set(proxy, cache);
    } else {
      cache = {
        id,
        type: STORE_TYPE.Proxy,
        pwr: new WeakRef(proxy),
      };
      this._fr.register(proxy, id, cache.pwr);
      this.proxyIdWM.set(proxy, id);
    }
    this.proxyIdStore.set(id, cache);
  }
  private _fr = new FinalizationRegistry((id) => this.releaseProxyId(id as number));
  /**
   * 释放导入的引用
   * @param id refId
   */
  releaseProxyId(id: number) {
    // console.log("release", this.name, id);
    const cache = this.proxyIdStore.get(id);
    if (cache) {
      this.proxyIdStore.delete(id);
      if (cache.type === STORE_TYPE.Symbol) {
        this.proxyIdStore.delete(cache.sym);
      } else {
        //   this.proxyIdWM.delete(cache.)
        this._fr.unregister(cache.pwr);
      }
      // 删除缓存的扩展信息
      this.idExtendsStore.delete(id);
      this._onReleaseCallback(id);
      return true;
    }
    return false;
  }
  private _onReleaseCallback(id: number): unknown {
    return;
  }
  /**监听一个引用被释放 */
  onRelease(cb: (id: number) => unknown) {
    this._onReleaseCallback = cb;
  }
}
// export const importStore = new ImportStore();
