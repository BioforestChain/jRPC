import { LinkObjType } from "@bfchain/link-typings";
import { EsmBuildInObjectKeyValueList, EsmBuildInObject_VK } from "./const";
import { RefStore } from "./refStore";
import { cacheGetter } from "@bfchain/util-decorator";

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

export const globalRefStore = new RefStore();
Object.refRemote = globalRefStore.refRemote;
Object.unrefRemote = globalRefStore.unrefRemote;

export class ImportStore<IOB /*  = unknown */, TB /*  = unknown */, E> {
  constructor(
    public readonly name: string,
    private port: BFChainLink.BinaryPort<TB>,
    private transfer: BFChainLink.ModelTransfer<IOB, TB>,
    /** 共享内建对象 */
    public readonly isShareBuildIn: boolean,
  ) {
    if (isShareBuildIn) {
      /// 导入内建对象
      for (const item of EsmBuildInObjectKeyValueList) {
        this.saveProxyId(item[1], item[0]);
      }
    }
  }
  /**存储协议扩展信息 */
  idExtendsStore = new Map<number, E>();
  /**我所导入的引用对象与符号 */
  private proxyIdStore = new Map<number | /* object | */ symbol, StoreItem>();
  private proxyIdWM = new WeakMap<object, number>();
  /**这里的 */
  private _innerRefStore = new RefStore();
  /**将本地对象与远端代理对象进行绑定关联
   * 可以用于做缓存对象：本地创建一个对象用于缓存，但在传输过程中可以还原成远端对象。
   *
   * 它的作用和JSON.stringify中toJSON的作用一样。是在做转换前的一个置换操作。
   * 但是如果开放让开发者自定义一个 toProxy，开发者就需要考虑多个comlink之间的问题，反而会增加开发者的心智负担。
   * 所以就只开放一个绑定两个object的简单操作，后续将一个对象在多个comlink之间传输，再由底层提供优化操作即可。
   */
  @cacheGetter
  get refRemote() {
    return this._innerRefStore.refRemote;
  }
  @cacheGetter
  get unrefRemote() {
    return this._innerRefStore.unrefRemote;
  }
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
        const refedObj =
          this._innerRefStore.getRefedObject(proxy) ||
          globalRefStore.getRefedObject(proxy) ||
          proxy;
        const id = this.proxyIdWM.get(refedObj);
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
