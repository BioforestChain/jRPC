export class ExportStore {
  /**提供给远端的 refId|symId
   * 远端可以使用 locId 来进行访问
   */
  accId = 0;
  /**我所导出的符号 */
  symIdStore = new Map<
    number | symbol,
    {
      id: number;
      sym: symbol;
    }
  >();
  /**我所导出的引用对象 */
  private objIdStore = new Map<
    number,
    // /**key */
    // | number
    // /**obj */
    // | object,
    {
      id: number;
      // obj: object;
      wr: WeakRef<object>;
    }
  >();
  private objIdWM = new WeakMap<object, number>();
  getObjById(id: number) {
    const cache = this.objIdStore.get(id);
    if (cache) {
      const obj = cache.wr.deref();
      if (obj !== undefined) {
        return obj;
      }
      this.releaseById(id);
    }
  }
  getIdByObj(obj: object) {
    return this.objIdWM.get(obj);
  }

  private _fr = new FinalizationRegistry((id) =>
    this.releaseById(id as number)
  );
  /**
   * 保存对象的引用
   */
  saveObjId(obj: object, id = this.accId++) {
    /// 保存到map中
    const wr = new WeakRef(obj);
    this.objIdStore.set(id, { id, wr });
    this.objIdWM.set(obj, id);
    /// 注册释放回调
    this._fr.register(obj, id, wr);
    return id;
  }
  /**
   * 释放对象的引用
   * @param id
   */
  releaseById(id: number) {
    let success = false;
    const cache = this.objIdStore.get(id);
    if (cache) {
      success = true;
      this.objIdStore.delete(id);
      const obj = cache.wr.deref();
      if (obj !== undefined) {
        this._fr.unregister(cache.wr);
      }
    } else {
      const sym = this.symIdStore.get(id);
      if (sym) {
        success = true;
        this.symIdStore.delete(id);
        this.symIdStore.delete(sym.sym);
      }
    }

    /// 触发回调
    if (success) {
      this._onReleaseCallback(id);
    }
  }

  private _onReleaseCallback(id: number): unknown {
    return;
  }
  /**监听一个引用被释放 */
  onRelease(cb: (id: number) => unknown) {
    this._onReleaseCallback = cb;
  }
}
