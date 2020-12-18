import { LinkObjType, EmscriptenReflect } from "@bfchain/comlink-typings";
import { ESM_REFLECT_FUN_MAP, OpenArg, SyncForCallback, SyncToCallback } from "./helper";
import { ExportStore } from "./ExportStore";
import { ImportStore } from "./ImportStore";

export abstract class ComlinkCore<IOB /*  = unknown */, TB /*  = unknown */, IMP_EXTENDS> {
  constructor(public readonly port: BFChainComlink.BinaryPort<TB>, public readonly name: string) {
    this._listen();
  }
  $destroy(): boolean {
    throw new Error("Method not implemented.");
  }

  abstract readonly transfer: BFChainComlink.ModelTransfer<IOB, TB>;

  exportStore = new ExportStore(this.name);
  importStore = new ImportStore<IMP_EXTENDS>(this.name);

  protected abstract $beforeImportRef<T>(
    port: BFChainComlink.BinaryPort<TB>,
    refId: number,
  ): BFChainComlink.ImportRefHook<T>;

  /**用于存储导出的域 */
  private _exportModule = { scope: Object.create(null), isExported: false };
  private _getInitedExportScope() {
    const { _exportModule } = this;
    if (_exportModule.isExported === false) {
      _exportModule.isExported = true;
      this.exportStore.exportObject(_exportModule.scope);
    }
    return _exportModule.scope;
  }
  export(source: unknown, name = "default") {
    Reflect.set(this._getInitedExportScope(), name, source);
  }
  protected $getEsmReflectHanlder(operator: EmscriptenReflect) {
    const handler = ESM_REFLECT_FUN_MAP.get(operator);
    if (!handler) {
      throw new SyntaxError("no support operator:" + operator);
    }
    return handler;
  }
  private _listen() {
    const { exportStore: exportStore, port } = this;
    port.onMessage((cb, bin) =>
      SyncForCallback(cb, () => {
        const linkObj = this.transfer.transferableBinary2LinkObj(bin);

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
            let res;

            /**JS语言中，this对象不用传输。
             * 但在Comlink协议中，它必须传输：
             * 因为我们使用call/apply模拟，所以所有所需的对象都需要传递进来
             */
            const operator = this.transfer.InOutBinary2Any(linkObj.in[0]) as EmscriptenReflect;
            const paramList = linkObj.in.slice(1).map((iob) => this.transfer.InOutBinary2Any(iob));

            if (EmscriptenReflect.Multi === operator) {
              /// 批量操作
              res = obj;
              for (let i = 0; i < paramList.length; i++) {
                const len = paramList[i] as number;
                const $operator = paramList[i + 1] as EmscriptenReflect;
                const $paramList = paramList.slice(i + 1, i + len);
                const $handler = this.$getEsmReflectHanlder($operator);
                res = $handler(res, $paramList);
              }
            } else {
              // const funStoreItem = this.importStore.getProxy(obj);
              // if(funStoreItem){
              //   // 使用远端的函数进行对象创建，那么这时候可以直接提供占位符，用于存储其返回结果。
              //   const pid = this.importStore.createPid();
              //   paramList.unshift(pid)
              //   Reflect.apply(obj, paramList);
              //   return {type:'placeholder', pid}
              // }
              /// 单项操作
              const handler = this.$getEsmReflectHanlder(operator);
              res = handler(obj, paramList);
            }

            /// 如果有返回结果的需要，那么就尝试进行返回
            if (linkObj.hasOut) {
              linkOut.out.push(this.transfer.Any2InOutBinary(res));
            }
          } catch (err) {
            linkOut.isThrow = true;
            // 将错误放在之后一层
            linkOut.out.push(this.transfer.Any2InOutBinary(err));
          }
          return this.transfer.linkObj2TransferableBinary(linkOut);
        } else if (linkObj.type === LinkObjType.Import) {
          const scope = this._getInitedExportScope();
          return this.transfer.linkObj2TransferableBinary({
            type: LinkObjType.Export,
            module: this.transfer.Any2InOutBinary(scope),
          });
        } else if (linkObj.type === LinkObjType.Release) {
          exportStore.releaseById(linkObj.locId);
        }
      }),
    );
    this.importStore.onRelease((refId) => {
      // console.log("send release", refId);
      port.send(
        this.transfer.linkObj2TransferableBinary({
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
  protected $getImportModule(cb: BFChainComlink.Callback<object>) {
    const { port } = this;
    /**
     * 进行协商握手，取得对应的 refId
     * @TODO 这里将会扩展出各类语言的传输协议
     */
    if (this._importModule === undefined) {
      port.req(
        SyncToCallback(cb, (ret) => {
          const bin = OpenArg(ret);
          const linkObj = this.transfer.transferableBinary2LinkObj(bin);
          if (linkObj.type !== LinkObjType.Export) {
            throw new TypeError();
          }
          /// 握手完成，转成代理对象
          return (this._importModule = this.transfer.InOutBinary2Any(linkObj.module) as object);
        }),
        this.transfer.linkObj2TransferableBinary({ type: LinkObjType.Import }),
      );
      return;
    }
    cb({
      isError: false,
      data: this._importModule,
    });
  }

  protected $import<T>(cb: BFChainComlink.Callback<T>, key: string) {
    this.$getImportModule(
      SyncToCallback(cb, (importModuleRet) => Reflect.get(OpenArg(importModuleRet), key)),
    );
  }

  protected $sendLinkIn<R = unknown>(
    cb: BFChainComlink.Callback<R>,
    port: BFChainComlink.BinaryPort<TB>,
    targetId: number,
    linkIn: unknown[],
    hasOut: boolean,
  ) {
    port.req(
      SyncToCallback(cb, (ret) => {
        const bin = OpenArg(ret);
        const linkObj = this.transfer.transferableBinary2LinkObj(bin);

        if (linkObj.type !== LinkObjType.Out) {
          throw new TypeError();
        }

        if (linkObj.isThrow) {
          const err_iob = linkObj.out.slice().pop();
          const err = err_iob && this.transfer.InOutBinary2Any(err_iob);
          throw err;
        } else {
          const res_iob = linkObj.out.slice().pop();
          const res = res_iob && this.transfer.InOutBinary2Any(res_iob);
          return res as R;
        }
      }),
      this.transfer.linkObj2TransferableBinary({
        type: LinkObjType.In,
        // reqId,
        targetId,
        in: linkIn.map((a) => this.transfer.Any2InOutBinary(a)),
        hasOut,
      }),
    );
  }

  /**
   * 主动生成引用代理
   * @param port
   * @param refId
   */
  createImportByRefId<T>(port: BFChainComlink.BinaryPort<TB>, refId: number) {
    const ref = this.$beforeImportRef<T>(port, refId);
    const source = ref.getSource();
    if (ref.type === "object") {
      const proxyHanlder = ref.getProxyHanlder();
      const proxy = new Proxy(source as never, proxyHanlder);
      ref.onProxyCreated?.(proxy);
      return proxy;
    }
    return source;
  }
}
