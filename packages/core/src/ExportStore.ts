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
      this.objIdStore.delete(id);
    }
  }
  // getObjIdById(id: number) {
  //   const obj = this.getObjById(id);
  //   if (obj) {
  //     return { obj, id };
  //   }
  // }
  getIdByObj(obj: object) {
    return this.objIdWM.get(obj);
  }
  // getObjIdByObj(obj: object) {
  //   const id = this.getIdByObj(obj);
  //   if (id !== undefined) {
  //     return { id, obj };
  //   }
  // }
  saveObjId(obj: object, id = this.accId++) {
    const wr = new WeakRef(obj);
    this.objIdStore.set(id, { id, wr });
    this.objIdWM.set(obj, id);
    return id;
  }
}
