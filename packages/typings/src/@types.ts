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

  // type ComlinkIOB<T> = T extends <>
  /**
   * 传输的模型转换
   */
  interface ModelTransfer<IOB, TB> {
    /**任意类型的对象 转换到 IOB
     * 因为obj的转换需要时间，所以这个接口是异步的
     */
    Any2InOutBinary(cb: Callback<IOB>, obj: unknown): unknown;
    /**IOB 转换到 任意类型的对象 */
    InOutBinary2Any(/* port: BinaryPort<TB>, */ bin: IOB): unknown;

    /**IO指令 转成 可传输的模型 */
    linkObj2TransferableBinary(obj: LinkObj<IOB>): TB;
    /**可传输的模型 转成 IO指令 */
    transferableBinary2LinkObj(bin: TB): LinkObj<IOB>;
  }

  /**定义数据管道的双工规范
   * 这里使用pipe的风格进行定义，而不是MessagePort那样的监听
   * 这里使用callback，可以根据回调函数进行强行转化成异步或者同步
   * 从而可以同时适用于 同步 与 异步 的风格
   */
  interface BinaryPort<TB> {
    onMessage: (listener: BinaryPort.MessageListener<TB>) => void;
    /**请求数据，如果是同步模式，要求阻塞 */
    req(cb: Callback<TB>, bin: TB): unknown;
    /**发送数据，不要求阻塞 */
    send(bin: TB): void;
    // /**非阻塞地传输数据 */
    // reqAsync(cb: Callback<TB>, bin: TB): void;
    // sendAsync(bin: TB): void;
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

  type ImportRefHook<S> =
    | ImportObjectRefHook<S> //(S extends object ? ImportObjectRefHook<S> : ImportPrimitiveRefHook<S>)
    | ImportPrimitiveRefHook<S>;
  type ToObject<T> = T extends object ? T : never;
  type ImportObjectRefHook<S, O extends ToObject<S> = ToObject<S>> = {
    type: "object";
    getSource: () => O;
    getProxyHanlder: () => BFChainComlink.EmscriptionProxyHanlder<O>;
    // onProxyCreated?: (proxy: O) => unknown;
  };
  type ImportPrimitiveRefHook<S> = {
    type: "primitive";
    getSource: () => S;
  };

  namespace Util {
    type Promisify<T> = T extends PromiseLike<unknown> ? T : PromiseLike<T>;
    type Unpromisify<P> = P extends PromiseLike<infer T> ? T : P;
  }
}
