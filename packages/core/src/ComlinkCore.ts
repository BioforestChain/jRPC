import { LinkObjType, EmscriptenReflect } from "@bfchain/comlink-typings";
import { ESM_REFLECT_FUN_MAP } from "./const";
import { ExportStore } from "./ExportStore";
import { ImportStore } from "./ImportStore";

export abstract class ComlinkCore<IOB /*  = unknown */, TB /*  = unknown */, IMP_EXTENDS>
  implements BFChainComlink.ComlinkCore<IOB, TB> {
  constructor(
    protected readonly port: BFChainComlink.BinaryPort<TB>,
    public readonly name: string,
  ) {
    this._listen();
  }
  destroy(): boolean {
    throw new Error("Method not implemented.");
  }

  protected exportStore = new ExportStore(this.name);
  protected importStore = new ImportStore<IMP_EXTENDS>(this.name);

  abstract Any2InOutBinary(obj: unknown): IOB;
  abstract InOutBinary2Any(bin: IOB): unknown;
  abstract linkObj2TransferableBinary(obj: BFChainComlink.LinkObj<IOB>): TB;
  abstract transferableBinary2LinkObj(bin: TB): BFChainComlink.LinkObj<IOB>;

  protected abstract $beforeImportRef<T>(
    port: BFChainComlink.BinaryPort<TB>,
    refId: number,
  ): BFChainComlink.ImportRefHook<T>;

  protected $exportSymbol(source: symbol) {
    return this.exportStore.getId(source) ?? this.exportStore.saveSymId(source);
  }
  protected $exportObject(source: object) {
    return this.exportStore.getId(source) ?? this.exportStore.saveObjId(source);
  }

  /**用于存储导出的域 */
  private _exportModule = { scope: Object.create(null), isExported: false };
  private _getInitedExportScope() {
    const { _exportModule } = this;
    if (_exportModule.isExported === false) {
      _exportModule.isExported = true;
      this.$exportObject(_exportModule.scope);
    }
    return _exportModule.scope;
  }
  export(source: unknown, name = "default") {
    Reflect.set(this._getInitedExportScope(), name, source);
  }
  private _listen() {
    const { exportStore, port } = this;
    port.onMessage((bin) => {
      const linkObj = this.transferableBinary2LinkObj(bin);

      if (linkObj.type === LinkObjType.In) {
        const obj = exportStore.getObjById(linkObj.targetId);
        if (obj === undefined) {
          throw new ReferenceError("no found");
        }
        /**预备好结果 */
        const linkOut: BFChainComlink.LinkOutObj<IOB> = {
          type: LinkObjType.Out,
          // resId: linkObj.reqId,
          out: [],
          isThrow: false,
        };
        try {
          /**JS语言中，this对象不用传输。
           * 但在Comlink协议中，它必须传输：
           * 因为我们使用call/apply模拟，所以所有所需的对象都需要传递进来
           */
          const operator = this.InOutBinary2Any(linkObj.in[0]) as EmscriptenReflect;
          const handler = ESM_REFLECT_FUN_MAP.get(operator);
          if (!handler) {
            throw new SyntaxError("no support operator:" + operator);
          }
          const paramList = linkObj.in.slice(1).map((iob) => this.InOutBinary2Any(iob));

          const res = handler(obj, paramList);

          /// 如果有返回结果的需要，那么就尝试进行返回
          if (linkObj.hasOut) {
            linkOut.out.push(this.Any2InOutBinary(res));
          }
        } catch (err) {
          linkOut.isThrow = true;
          // 将错误放在之后一层
          linkOut.out.push(this.Any2InOutBinary(err));
        }
        return this.linkObj2TransferableBinary(linkOut);
      } else if (linkObj.type === LinkObjType.Import) {
        const scope = this._getInitedExportScope();
        return this.linkObj2TransferableBinary({
          type: LinkObjType.Export,
          module: this.Any2InOutBinary(scope),
        });
      } else if (linkObj.type === LinkObjType.Release) {
        exportStore.releaseById(linkObj.locId);
      }
    });
    this.importStore.onRelease((refId) => {
      // console.log("send release", refId);
      port.send(
        this.linkObj2TransferableBinary({
          type: LinkObjType.Release,
          locId: refId,
        }),
      );
    });
  }
  //#endregion

  //#region 进口

  /**用于存储导入的域 */
  private _importModule?: object;

  import<T>(key = "default") {
    const { port } = this;
    /**
     * 进行协商握手，取得对应的 refId
     * @TODO 这里将会扩展出各类语言的传输协议
     */
    if (this._importModule === undefined) {
      const res = this.transferableBinary2LinkObj(
        port.req(this.linkObj2TransferableBinary({ type: LinkObjType.Import })),
      );
      if (res.type !== LinkObjType.Export) {
        throw new TypeError();
      }
      /// 握手完成，转成代理对象
      this._importModule = this.InOutBinary2Any(res.module) as object;
    }
    return Reflect.get(this._importModule, key) as T;
  }

  protected $sendLinkIn<R = unknown>(
    port: BFChainComlink.BinaryPort<TB>,
    targetId: number,
    linkIn: unknown[],
    hasOut: boolean,
  ) {
    const linkObj = this.transferableBinary2LinkObj(
      port.req(
        this.linkObj2TransferableBinary({
          type: LinkObjType.In,
          // reqId,
          targetId,
          in: linkIn.map((a) => this.Any2InOutBinary(a)),
          hasOut,
        }),
      ),
    );
    if (linkObj.type !== LinkObjType.Out) {
      throw new TypeError();
    }

    if (linkObj.isThrow) {
      const err_iob = linkObj.out.slice().pop();
      const err = err_iob && this.InOutBinary2Any(err_iob);
      throw err;
    } else {
      const res_iob = linkObj.out.slice().pop();
      const res = res_iob && this.InOutBinary2Any(res_iob);
      return res as R;
    }
  }

  protected $getDefaultProxyHanlder<T extends object>(
    port: BFChainComlink.BinaryPort<TB>,
    refId: number,
  ) {
    const send = <R = unknown>(linkIn: unknown[], hasOut: boolean) =>
      this.$sendLinkIn<R>(port, refId, linkIn, hasOut);

    const proxyHandler: BFChainComlink.EmscriptionProxyHanlder<T> = {
      getPrototypeOf: (_target) => send<object | null>([EmscriptenReflect.GetPrototypeOf], true),
      setPrototypeOf: (_target, proto) =>
        send<boolean>([EmscriptenReflect.SetPrototypeOf, proto], true),
      isExtensible: (target) => send<boolean>([EmscriptenReflect.IsExtensible], true),
      preventExtensions: (_target) => send<boolean>([EmscriptenReflect.PreventExtensions], true),
      getOwnPropertyDescriptor: (_target, prop: PropertyKey) =>
        send<PropertyDescriptor | undefined>(
          [EmscriptenReflect.GetOwnPropertyDescriptor, prop],
          true,
        ),
      has: (_target, prop: PropertyKey) => send<boolean>([EmscriptenReflect.Has], true),
      /**导入子模块 */
      get: (_target, prop, _reciver) =>
        // console.log("get", prop),
        send<boolean>([EmscriptenReflect.Get, prop], true),
      /**发送 set 操作 */
      set: (_target, prop: PropertyKey, value: any, receiver: any) => (
        send<boolean>([EmscriptenReflect.Set, prop, value], false), true
      ),
      deleteProperty: (_target, prop: PropertyKey) => (
        send([EmscriptenReflect.DeleteProperty, prop], false), true
      ),
      defineProperty: (_target, prop: PropertyKey, attr: PropertyDescriptor) => (
        send([EmscriptenReflect.DefineProperty, prop, attr], false), true
      ),
      ownKeys: (_target) => send([EmscriptenReflect.OwnKeys], true),
      apply: (_target, thisArg, argArray) =>
        send([EmscriptenReflect.Apply, thisArg, ...argArray], true),
      construct: (_target, argArray, newTarget) =>
        send([EmscriptenReflect.Construct, newTarget, ...argArray], true),
    };
    return proxyHandler;
  }
  /**
   * 主动生成引用代理
   * @param port
   * @param refId
   */
  protected $createImportByRefId<T>(port: BFChainComlink.BinaryPort<TB>, refId: number) {
    const ref = this.$beforeImportRef<T>(port, refId);
    const source = ref.getSource();
    const proxyHanlder = ref.getProxyHanlder?.();
    if (proxyHanlder) {
      return new Proxy(source, proxyHanlder);
    }
    return source;
  }
}
