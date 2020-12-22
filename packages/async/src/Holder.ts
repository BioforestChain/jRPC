const _INNER_HODER_TOKEN = Symbol("holder.source");
class HolderSource {
  private static _accId = 0;
  public readonly id = HolderSource._accId++;
  constructor(privateToken: typeof _INNER_HODER_TOKEN) {
    if (_INNER_HODER_TOKEN !== privateToken) {
      throw new Error("use holderStore.createPid");
    }
  }
}

export function createHolder<T>() {
  const source = function holderSource() {};
  const proxyHandler: ProxyHandler<any> = {};
  const holder = new Proxy(source, proxyHandler) as T;
  return {
    holder,
    proxyHandler,
  };
}
