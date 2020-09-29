import {
  LinkObjType,
  ESM_REFLECT_FUN_MAP,
  EmscriptenReflect,
} from "@bfchain/comlink-typings";
import { ExportStore } from "./ExportStore";
import { ImportStore } from "./ImportStore";

export abstract class ComlinkCore<IOB /*  = unknown */, TB /*  = unknown */>
  implements BFChainComlink.ComlinkCore<IOB, TB> {
  close(port: BFChainComlink.BinaryPort<TB>): boolean {
    throw new Error("Method not implemented.");
  }
  recycle(target: object): boolean {
    throw new Error("Method not implemented.");
  }

  protected exportStore = new ExportStore();
  protected importStore = new ImportStore<unknown>();

  abstract Any2InOutBinary(obj: unknown): IOB;
  abstract InOutBinary2Any(
    port: BFChainComlink.BinaryPort<TB>,
    bin: IOB
  ): unknown;
  abstract linkObj2TransferableBinary(obj: BFChainComlink.LinkObj<IOB>): TB;
  abstract transferableBinary2LinkObj(bin: TB): BFChainComlink.LinkObj<IOB>;

  protected abstract _beforeImportRef<T>(
    port: BFChainComlink.BinaryPort<TB>,
    refId: number
  ): BFChainComlink.ImportRefHook<T>;

  protected _exportSymbol(source: symbol) {
    let cache = this.exportStore.symIdStore.get(source);
    if (!cache) {
      cache = {
        sym: source,
        id: this.exportStore.accId++,
      };
      this.exportStore.symIdStore.set(cache.id, cache);
      this.exportStore.symIdStore.set(source, cache);
    }
    return cache.id;
  }
  protected _exportObject(source: object) {
    let id = this.exportStore.getIdByObj(source);
    if (!id) {
      id = this.exportStore.saveObjId(source);
    }
    return id;
  }

  /**用于存储导出的域 */
  private _exportModule = { scope: {}, isExported: false };
  export(source: unknown, name = "default") {
    const { _exportModule } = this;
    if (_exportModule.isExported === false) {
      _exportModule.isExported = true;
      this._exportObject(_exportModule.scope);
    }
    Object.defineProperty(_exportModule.scope, name, {
      value: source,
      configurable: true,
      enumerable: true,
      writable: true,
    });
    // let id: number;
    // if (typeof source === "symbol") {
    //   id = this._exportSymbol(source);
    //   this._exportWithName(name, "sym", id);
    // } else {
    //   id = this._exportObject(source);
    //   this._exportWithName(name, "obj", id);
    // }
    // return id;
  }
  async listen(port: BFChainComlink.BinaryPort<TB>) {
    port.onMessage((bin) => {
      const linkObj = this.transferableBinary2LinkObj(bin);
      /**预备好结果 */
      if (linkObj.type === LinkObjType.In) {
        const obj = this.exportStore.getObjById(linkObj.targetId);
        if (!obj) {
          throw new ReferenceError("no found");
        }
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
          const operator = this.InOutBinary2Any(
            port,
            linkObj.in[0]
          ) as EmscriptenReflect;
          const handler = ESM_REFLECT_FUN_MAP.get(operator);
          if (!handler) {
            throw new SyntaxError("no support operator:" + operator);
          }
          const paramList = linkObj.in
            .slice(1)
            .map((iob) => this.InOutBinary2Any(port, iob));

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
      }
    });
  }
  //#endregion

  //#region 进口

  /**用于存储导入的域 */
  private _importModule?: object;

  import<T>(port: BFChainComlink.BinaryPort<TB>, key = "default") {
    /**
     * @TODO 进行协商握手，取得对应的 refId
     * 目前这里是InnerComlink在做模拟
     */
    if (this._importModule === undefined) {
      const refId = 0;
      /// 握手完成，转成代理对象
      const cachedProxy = this.importStore.getProxyById<object>(refId);
      if (cachedProxy === undefined) {
        throw new ReferenceError();
      }
      this._importModule = cachedProxy;
    }
    return Reflect.get(this._importModule, key) as T;
  }

  // private _reqIdAcc = 0;
  // private _reqPoCache = new Map<number, PromiseOut<unknown>>();

  protected _sendLinkIn<R = unknown>(
    port: BFChainComlink.BinaryPort<TB>,
    targetId: number,
    linkIn: unknown[],
    hasOut: boolean
  ) {
    const linkObj = this.transferableBinary2LinkObj(
      port.req(
        this.linkObj2TransferableBinary({
          type: LinkObjType.In,
          // reqId,
          targetId,
          in: linkIn.map((a) => this.Any2InOutBinary(a)),
          hasOut,
        })
      )
    );
    if (linkObj.type === LinkObjType.In) {
      throw new TypeError();
    }

    if (linkObj.isThrow) {
      const err_iob = linkObj.out.slice().pop();
      const err = err_iob && this.InOutBinary2Any(port, err_iob);
      throw err;
    } else {
      const res_iob = linkObj.out.slice().pop();
      const res = res_iob && this.InOutBinary2Any(port, res_iob);
      return res as R;
    }
  }

  protected _getDefaultProxyHanlder<T extends object>(
    port: BFChainComlink.BinaryPort<TB>,
    refId: number
  ) {
    const send = <R = unknown>(linkIn: unknown[], hasOut: boolean) =>
      this._sendLinkIn<R>(port, refId, linkIn, hasOut);

    const proxyHandler: BFChainComlink.EmscriptionProxyHanlder<T> = {
      getPrototypeOf: (_target) =>
        send<object | null>([EmscriptenReflect.GetPrototypeOf], true),
      setPrototypeOf: (_target, proto) =>
        send<boolean>([EmscriptenReflect.SetPrototypeOf, proto], true),
      isExtensible: (target) =>
        send<boolean>([EmscriptenReflect.IsExtensible], true),
      preventExtensions: (_target) =>
        send<boolean>([EmscriptenReflect.PreventExtensions], true),
      getOwnPropertyDescriptor: (_target, prop: PropertyKey) =>
        send<PropertyDescriptor | undefined>(
          [EmscriptenReflect.GetOwnPropertyDescriptor, prop],
          true
        ),
      has: (_target, prop: PropertyKey) =>
        send<boolean>([EmscriptenReflect.Has], true),
      /**导入子模块 */
      get: (_target, prop, _reciver) =>
        send<boolean>([EmscriptenReflect.Get, prop], true),
      /**发送 set 操作 */
      set: (_target, prop: PropertyKey, value: any, receiver: any) => (
        send<boolean>([EmscriptenReflect.Set, prop, value], false), true
      ),
      deleteProperty: (_target, prop: PropertyKey) => (
        send([EmscriptenReflect.DeleteProperty, prop], false), true
      ),
      defineProperty: (
        _target,
        prop: PropertyKey,
        attr: PropertyDescriptor
      ) => (send([EmscriptenReflect.DefineProperty, prop, attr], false), true),
      ownKeys: (_target) => send([EmscriptenReflect.OwnKeys], true),
      apply: (_target, thisArg, argArray) =>
        send([EmscriptenReflect.Apply, thisArg, argArray], true),
      construct: (_target, argArray, newTarget) =>
        send([EmscriptenReflect.Construct, argArray, newTarget], true),
    };
    return proxyHandler;
  }
  /**
   * 主动生成引用代理
   * @param port
   * @param refId
   */
  protected _createImportByRefId<T>(
    port: BFChainComlink.BinaryPort<TB>,
    refId: number
  ) {
    const ref = this._beforeImportRef<T>(port, refId);
    const source = ref.getSource();
    const proxyHanlder = ref.getProxyHanlder?.();
    if (proxyHanlder) {
      return new Proxy(source, proxyHanlder);
    }
    return source;
  }
}
