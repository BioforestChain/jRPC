import { LinkObjType, EmscriptenReflect } from "@bfchain/link-typings";
import { ESM_REFLECT_FUN_MAP, OpenArg, resolveCallback, SyncPiperFactory } from "./helper";
import type { ExportStore } from "./ExportStore";
import type { ImportStore } from "./ImportStore";
import { bindThis } from "@bfchain/util-decorator";
import { Var } from "./Var";

export abstract class ComlinkCore<IOB /*  = unknown */, TB /*  = unknown */, IMP_EXTENDS>
  implements BFChainLink.ComlinkCore {
  constructor(
    public readonly port: BFChainLink.BinaryPort<TB>,
    public readonly name: string,
    /** 共享内建对象 */
    public readonly isShareBuildIn: boolean,
  ) {
    this._listen();
  }
  $destroy(): boolean {
    throw new Error("Method not implemented.");
  }

  abstract readonly transfer: BFChainLink.ModelTransfer<IOB, TB>;
  abstract readonly exportStore: ExportStore;
  abstract readonly importStore: ImportStore<IOB, TB, IMP_EXTENDS>;

  //#region 出口
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
    this.port.onMessage(async (cb, bin) => {
      const out_void = () => resolveCallback(cb, undefined);

      const linkObj = this.transfer.transferableBinary2LinkObj(bin);

      if (linkObj.type === LinkObjType.In) {
        const obj = this.exportStore.getObjById(linkObj.targetId);
        if (obj === undefined) {
          throw new ReferenceError("no found");
        }
        /**预备好结果 */
        const linkOut: BFChainLink.LinkOutObj<IOB> = {
          type: LinkObjType.Out,
          // resId: linkObj.reqId,
          out: [],
          isThrow: false,
        };
        const out_linkOut = (anyResList: unknown[]) => {
          let resolved = 0;
          const tryResolve = () => {
            resolved += 1;
            if (resolved === anyResList.length) {
              resolveCallback(cb, this.transfer.linkObj2TransferableBinary(linkOut));
            }
          };
          const outStartIndex = linkOut.out.length;
          for (let i = 0; i < anyResList.length; i++) {
            const anyRes = anyResList[i];
            this.transfer.Any2InOutBinary(
              (iobRet) => {
                if (iobRet.isError) {
                  return cb(iobRet);
                }
                linkOut.out[outStartIndex + i] = iobRet.data;
                tryResolve();
              },
              anyRes,
              this.$pushToRemote,
            );
          }
        };

        try {
          let res: any;
          /**JS语言中，this对象不用传输。
           * 但在Comlink协议中，它必须传输：
           * 因为我们使用call/apply模拟，所以所有所需的对象都需要传递进来
           */
          const operator = this.transfer.InOutBinary2Any(linkObj.in[0]) as EmscriptenReflect;
          const paramList = linkObj.in.slice(1).map((iob) => this.transfer.InOutBinary2Any(iob));

          if (EmscriptenReflect.Multi === operator) {
            /// 批量操作
            res = obj;
            let $handler:
              | ReturnType<ComlinkCore<IOB, TB, IMP_EXTENDS>["$getEsmReflectHanlder"]>
              | undefined;
            const varList: unknown[] = [obj];
            for (let i = 0; i < paramList.length; ) {
              const $obj_source = paramList[i] as Var | number;
              const $obj =
                $obj_source instanceof Var
                  ? $obj_source.read(varList)
                  : this.exportStore.getObjById($obj_source);

              const len = paramList[i + 1] as number;
              const $operator = paramList[i + 2] as EmscriptenReflect;
              const $paramList = paramList
                .slice(i + 3, i + 3 + len - 1 /* - opeartor */)
                .map((param) => (param instanceof Var ? param.read(varList) : param));
              $handler = this.$getEsmReflectHanlder($operator);
              res = $handler.fun(
                $obj,
                $handler.paramListDeserialization?.($paramList) || $paramList,
              );
              if ($handler.isAsync) {
                res = await res;
              }
              varList.push(res);
              /// 因为是链式操作， 所以不需要立即执行hanlder对res进行编码
              i += len + 2;
            }
            res = $handler?.resultSerialization?.(res) || [res];
          } else {
            /// 单项操作
            const handler = this.$getEsmReflectHanlder(operator);
            res = handler.fun(obj, handler.paramListDeserialization?.(paramList) || paramList);

            if (handler.isAsync) {
              res = await res;
            }
            res = handler.resultSerialization?.(res) || [res];
          }

          /// 如果有返回结果的需要，那么就尝试进行返回
          if (linkObj.hasOut) {
            return out_linkOut(res);
          } else {
            return out_void();
          }
        } catch (err) {
          linkOut.isThrow = true;
          return out_linkOut([err]);
        }
      } else if (linkObj.type === LinkObjType.Import) {
        const scope = this._getInitedExportScope();
        return this.transfer.Any2InOutBinary(
          (scopeRet) => {
            if (scopeRet.isError) {
              return cb(scopeRet);
            }
            resolveCallback(
              cb,
              this.transfer.linkObj2TransferableBinary({
                type: LinkObjType.Export,
                module: scopeRet.data,
              }),
            );
          },
          scope,
          this.$pushToRemote,
        );
      } else if (linkObj.type === LinkObjType.Release) {
        this.exportStore.releaseById(linkObj.locId);
      } else if (linkObj.type === LinkObjType.Push) {
        const refId = recObjCache.get(linkObj.oid);
        const out_refId = (refId: number) => {
          resolveCallback(
            cb,
            this.transfer.linkObj2TransferableBinary({
              type: LinkObjType.Pull,
              refId,
            }),
          );
        };
        if (typeof refId === "number") {
          recObjCache.delete(linkObj.oid);
          out_refId(refId);
        } else {
          recObjCache.set(linkObj.oid, out_refId);
        }
        return;
      }
      out_void();
    });

    /// 接收对象传输
    this.port.onObject((objBox) => {
      const { oid, obj } = this.transfer.transferableObject2Obj(objBox);
      const refId = this.exportStore.exportObject(obj);
      const cbFun = recObjCache.get(oid);
      if (typeof cbFun === "function") {
        recObjCache.delete(oid);
        cbFun(refId);
      } else {
        recObjCache.set(oid, refId);
      }
    });
    const recObjCache = new Map<number, number | ((refId: number) => void)>();
  }

  //#endregion

  //#region 进口

  /**用于存储导入的域 */
  private _importModule?: object;
  protected $getImportModule(output: BFChainLink.Callback<object>) {
    /**
     * 进行协商握手，取得对应的 refId
     * @TODO 这里将会扩展出各类语言的传输协议
     */
    if (this._importModule === undefined) {
      this.port.duplexMessage(
        SyncPiperFactory(output, (ret) => {
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
    output({
      isError: false,
      data: this._importModule,
    });
  }
  //#endregion

  private _objIdAcc = new Uint32Array(1);
  @bindThis
  $pushToRemote(output: BFChainLink.Callback<number>, obj: object, transfer?: object[]) {
    const { port } = this;
    const objId = this._objIdAcc[0]++;
    const X = this.transfer.obj2TransferableObject(objId, obj, transfer);
    port.duplexObject(X.objBox, X.transfer);

    port.duplexMessage(
      SyncPiperFactory(output, (ret) => {
        const bin = OpenArg(ret);
        const linkObj = this.transfer.transferableBinary2LinkObj(bin);
        if (linkObj.type !== LinkObjType.Pull) {
          throw new TypeError();
        }
        this.importStore.saveProxyId(obj, linkObj.refId);
        return linkObj.refId;
      }),
      this.transfer.linkObj2TransferableBinary({ type: LinkObjType.Push, oid: objId }),
    );
  }
}
