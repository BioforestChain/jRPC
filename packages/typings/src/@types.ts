declare namespace BFChainComlink {
  /**
   * IOB : InOutBinary
   * TB : TransferableBinary
   */
  interface ComlinkCore<IOB, TB> {
    //#region 传输的模型转换

    /**任意类型的对象 转换到 IOB */
    Any2InOutBinary(obj: unknown): IOB;
    /**IOB 转换到 任意类型的对象 */
    InOutBinary2Any(port: BinaryPort<TB>, bin: IOB): unknown;

    /**IO指令 转成 可传输的模型 */
    linkObj2TransferableBinary(obj: LinkObj<IOB>): TB;
    /**可传输的模型 转成 IO指令 */
    transferableBinary2LinkObj(bin: TB): LinkObj<IOB>;

    // /**判断一个对象是否可以克隆，或者只能引用传输 */
    // canClone(obj: unknown): boolean;

    //#endregion

    //#region 导入导出
    /**导出
     * 同语法：
     * export default target
     * export const key = target
     */
    export(target: object, key?: string): void;
    // /**取消导出 */
    // recycle(target: object): boolean;
    /**导入
     * 同语法：
     * import ? from port
     * import { key } from port
     */
    import<T extends object>(
      port: BinaryPort<TB>,
      key?: string
    ): PromiseLike<Remote<T>>;
    //#endregion

    //#region

    //#endregion

    // /**绑定一条通道 */
    // listen(port: BinaryPort<TB>): Promise<unknown /* 握手信息 */>;
    /**释放绑定的通道 */
    close(port: BinaryPort<TB>): boolean;
  }

  /**定义数据管道的双工规范
   * 这里使用pipe的风格进行定义，而不是MessagePort那样的监听
   * 从而可以同时适用于 同步 与 异步 的风格
   */
  interface BinaryPort<TB, RTB = TB> {
    // readStream: AsyncIterator<TB>;
    onMessage: (cb: (bin: TB) => TB | undefined) => void;
    // write(bin: TB): void;
    // close(): void;
    req(bin: TB): TB;
    send(bin: TB): void;
    // res(bin: TB): void;
  }

  type Remote<T> = T;

  interface LinkImportObj {
    type: import("./const").LinkObjType.Import;
  }
  interface LinkExportObj<IOB> {
    type: import("./const").LinkObjType.Export;
    module: IOB;
  }
  interface LinkInObj<IOB> {
    type: import("./const").LinkObjType.In;
    targetId: number;
    in: IOB[];
    hasOut: boolean;
  }
  interface LinkOutObj<IOB> {
    type: import("./const").LinkObjType.Out;
    out: IOB[];
    isThrow: boolean;
  }
  interface LinkReleaseObj {
    type: import("./const").LinkObjType.Release;
    locId: number;
  }
  type LinkObj<IOB> =
    | LinkImportObj
    | LinkExportObj<IOB>
    | LinkInObj<IOB>
    | LinkOutObj<IOB>
    | LinkReleaseObj;

  type EmscriptionProxyHanlder<T extends object> = Required<
    Omit<ProxyHandler<T>, "enumerate">
  >;

  type ImportRefHook<T> = T extends object
    ? {
        getSource: () => T;
        getProxyHanlder?: () => BFChainComlink.EmscriptionProxyHanlder<T>;
      }
    : {
        getSource: () => T;
        getProxyHanlder?: undefined;
      };
}
