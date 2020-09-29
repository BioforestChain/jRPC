export class ImportStore<E = unknown> {
  /**我所导入的引用对象与符号 */
  private proxyIdStore = new Map<
    number | object | symbol,
    {
      id: number;
      proxy: object | symbol;
    }
  >();
  getProxy(proxy: unknown) {
    return this.proxyIdStore.get(proxy as object | symbol | number);
  }
  getProxyById<FORCE_TYPE = symbol | object>(id: number) {
    const cache = this.proxyIdStore.get(id);
    if (cache) {
      return (cache.proxy as unknown) as FORCE_TYPE;
    }
  }
  /**
   * 保存导入引用
   * @param proxy Proxy<object>|remote-symbol-placeholder
   * @param id refId
   */
  saveProxyId(proxy: object | symbol, id: number) {
    const cache = {
      id,
      proxy,
    };
    this.proxyIdStore.set(proxy, cache);
    this.proxyIdStore.set(id, cache);
  }
  /**导入的命名 */
  nameStore = new Map<
    string | number,
    { type: "sym" | "obj"; name: string; id: number }
  >();
  idExtendsStore = new Map<number, E>();
}
// export const importStore = new ImportStore();
