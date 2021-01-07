import { LinkObjType } from "@bfchain/comlink-typings";

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

export class ImportStore<IOB /*  = unknown */, TB /*  = unknown */, E> {
  constructor(
    public readonly name: string,
    private port: BFChainComlink.BinaryPort<TB>,
    private transfer: BFChainComlink.ModelTransfer<IOB, TB>,
  ) {}
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
  /**为某一个对象记录 refId */
  backupProxyId(proxy: object, id: number) {
    this.proxyIdWM.set(proxy, id);
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
  /**发送对象释放的消息 */
  private _onReleaseCallback(refId: number) {
    this.port.simplexMessage(
      this.transfer.linkObj2TransferableBinary({
        type: LinkObjType.Release,
        locId: refId,
      }),
    );
  }
}
// export const importStore = new ImportStore();
