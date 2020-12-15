declare namespace BFChainComlink {
  type CallbackArg<D, E = Error> =
    | {
        isError: true;
        error: E;
      }
    | {
        isError: false;
        data: D;
      };
  type Callback<D, E = Error> = (ret: CallbackArg<D, E>) => unknown;
  type PipeCallback<I, O> = (inData: I, dataOuter: Callback<O>) => unknown;

  /**
   * 传输的模型转换
   */
  interface ModelTransfer<IOB, TB> {
    /**任意类型的对象 转换到 IOB */
    Any2InOutBinary(obj: unknown): IOB;
    /**IOB 转换到 任意类型的对象 */
    InOutBinary2Any(/* port: BinaryPort<TB>, */ bin: IOB): unknown;

    /**IO指令 转成 可传输的模型 */
    linkObj2TransferableBinary(obj: LinkObj<IOB>): TB;
    /**可传输的模型 转成 IO指令 */
    transferableBinary2LinkObj(bin: TB): LinkObj<IOB>;
  }
  /**
   * IOB : InOutBinary
   * TB : TransferableBinary
   */
  interface ComlinkCoreSync {
    //#region 导入导出
    /**导出
     * 同语法：
     * export default target
     * export const key = target
     */
    export(target: unknown, key?: string): void;
    /**导入
     * 同语法：
     * import ? from port
     * import { key } from port
     */
    import<T>(key?: string): T;
    //#endregion

    // /**释放绑定的通道 */
    // destroy(port: BinaryPort<TB>): boolean;
  }

  /**定义数据管道的双工规范
   * 这里使用pipe的风格进行定义，而不是MessagePort那样的监听
   * 这里使用callback，可以根据回调函数进行强行转化成异步或者同步
   * 从而可以同时适用于 同步 与 异步 的风格
   */
  interface BinaryPort<TB> {
    onMessage: (listener: BinaryPort.MessageListener<TB>) => void;
    req(cb: Callback<TB>, bin: TB): unknown;
    send(bin: TB): void;
  }
  namespace BinaryPort {
    type MessageListener<TB> = (cb: Callback<TB | undefined>, bin: TB) => unknown;
  }

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

  type EmscriptionProxyHanlder<T extends object> = Required<Omit<ProxyHandler<T>, "enumerate">>;

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
