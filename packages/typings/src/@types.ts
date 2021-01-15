declare namespace BFChainLink {
  interface ComlinkCore {
    /**导出
     * 同语法：
     * export default target
     * export const key = target
     */
    export(target: unknown, key?: string): void;
    // /**推送可传输的数据
    //  * 这里可能需要一些时间，所以始终是异步。
    //  * 推送完成后，本地对象会自动导入到 importStore 中，在传输后，会变成远端的对象
    //  */
    // pushTransferable(transferable: unknown): PromiseLike<void>;
  }

  type CallbackArg<D, E = unknown> =
    | {
        isError: true;
        error: E;
      }
    | {
        isError: false;
        data: D;
      };
  type Callback<D, E = unknown> = (ret: CallbackArg<D, E>) => unknown;
  type PipeCallback<I, O> = (inData: I, dataOuter: Callback<O>) => unknown;

  // type ComlinkIOB<T> = T extends <>
  /**
   * 传输的模型转换
   */
  interface ModelTransfer<IOB, TB> {
    /**任意类型的对象 转换到 IOB
     * 因为obj的转换可能需要时间，所以这个接口是异步的
     */
    Any2InOutBinary(cb: Callback<IOB>, obj: unknown,pushToRemote: (cb: BFChainLink.Callback<number>, obj: object) => void,): unknown;
    /**IOB 转换到 任意类型的对象 */
    InOutBinary2Any(/* port: BinaryPort<TB>, */ bin: IOB): unknown;

    /**IO指令 转成 可传输的模型 */
    linkObj2TransferableBinary(obj: LinkObj<IOB>): TB;
    /**可传输的模型 转成 IO指令 */
    transferableBinary2LinkObj(bin: TB): LinkObj<IOB>;

    obj2TransferableObject(
      oid: number,
      obj: object,
      transfer?: object[],
    ): { objBox: object; transfer: object[] };
    transferableObject2Obj(objBox: object): { oid: number; obj: object };
  }

  /**定义数据管道的双工规范
   * 这里使用pipe的风格进行定义，而不是MessagePort那样的监听
   * 这里使用callback，可以根据回调函数进行强行转化成异步或者同步
   * 从而可以同时适用于 同步 与 异步 的风格
   */
  interface BinaryPort<TB> {
    onMessage(listener: BinaryPort.MessageListener<TB>): void;
    /**请求数据，如果是同步模式，要求阻塞 */
    duplexMessage(cb: Callback<TB>, bin: TB): unknown;
    /**发送数据，不要求阻塞 */
    simplexMessage(bin: TB): void;

    onObject(listener: BinaryPort.ObjectListener): void;
    /**发送高级对象 */
    duplexObject(objBox: object, transfer: object[]): void;
  }
  namespace BinaryPort {
    type MessageListener<TB> = (cb: Callback<TB | undefined>, bin: TB) => unknown;
    type ObjectListener = Listener<object>;
    type Listener<T = unknown, R = unknown> = (obj: T) => R;
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
  interface LinkPushObj {
    type: import("./const").LinkObjType.Push;
    oid: number;
  }
  interface LinkPullObj {
    type: import("./const").LinkObjType.Pull;
    refId: number;
  }
  type LinkObj<IOB> =
    | LinkImportObj
    | LinkExportObj<IOB>
    | LinkInObj<IOB>
    | LinkOutObj<IOB>
    | LinkReleaseObj
    | LinkPushObj
    | LinkPullObj;

  type EmscriptionProxyHanlder<T extends object> = Required<Omit<ProxyHandler<T>, "enumerate">>;
  type FullEmscriptionProxyHanlder<T extends object> = EmscriptionProxyHanlder<T> & {
    asset(target: T, p: PropertyKey): any;
    typeOf(target: T): string;
    instanceOf(target: T, Ctor: unknown): boolean;
    jsonStringify(target: T): string;
  };

  type ImportRefHook<S> =
    | ImportObjectRefHook<S> //(S extends object ? ImportObjectRefHook<S> : ImportPrimitiveRefHook<S>)
    | ImportPrimitiveRefHook<S>;
  type ToObject<T> = T extends object ? T : never;
  type ImportObjectRefHook<S, O extends ToObject<S> = ToObject<S>> = {
    type: "object";
    getSource: () => O;
    getProxyHanlder: () => BFChainLink.FullEmscriptionProxyHanlder<O>;
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
