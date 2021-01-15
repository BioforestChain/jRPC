import { IOB_Type, ModelTransfer, refFunctionStaticToStringFactory } from "@bfchain/link-protocol";
import { LinkObjType } from "@bfchain/link-typings";
import type { ComlinkAsync } from "./ComlinkAsync";
import { ComlinkCore, helper } from "@bfchain/link-core";
import { HolderReflect } from "./HolderReflect";
import { getHolderReflect, isHolder } from "./Holder";
import { IOB_CACHE_STATUS } from "./const";

export class AsyncModelTransfer extends ModelTransfer<ComlinkAsync> {
  constructor(core: ComlinkAsync) {
    super(core);
  }

  /**这里保持使用cb风格，可以确保更好的性能
   * @TODO 内部的函数也应该尽可能使用cb风格来实现
   */
  sendLinkIn<R = unknown>(
    port: ComlinkProtocol.BinaryPort,
    targetId: number,
    linkIn: readonly unknown[],
    resTransfer?: (cb: BFChainLink.Callback<ComlinkProtocol.IOB>, resList: unknown[]) => void,
    hasOut?: BFChainLink.HolderReflect<R> | false,
  ) {
    const { transfer } = this.core;

    const doReq = (linkInIob: ComlinkProtocol.IOB[]) => {
      port.duplexMessage(
        async (ret) => {
          const bin = helper.OpenArg(ret);
          const linkObj = transfer.transferableBinary2LinkObj(bin);

          if (linkObj.type !== LinkObjType.Out) {
            throw new TypeError();
          }

          if (linkObj.isThrow) {
            const err_iob = linkObj.out[0];
            if (!err_iob) {
              throw new TypeError();
            }
            if (hasOut) {
              hasOut.bindIOB(err_iob, true);
            } else {
              /// 远端传来的异常，本地却没有可以捕捉的对象，协议不对称！
              throw err_iob;
            }
          } else if (hasOut) {
            if (resTransfer) {
              const resList: unknown[] = [];
              for (const res_iob of linkObj.out) {
                resList.push(transfer.InOutBinary2Any(res_iob));
              }
              resTransfer((ret) => hasOut.bindIOB(helper.OpenArg(ret)), linkObj.out);
            } else {
              hasOut.bindIOB(linkObj.out[0]);
            }
          }
        },
        transfer.linkObj2TransferableBinary({
          type: LinkObjType.In,
          // reqId,
          targetId,
          in: linkInIob,
          hasOut: hasOut !== undefined,
        }),
      );
    };

    /// 无参数需要解析，那么直接发送指令
    if (linkIn.length === 0) {
      doReq(linkIn as ComlinkProtocol.IOB[]);
    } else {
      /**结果列表 */
      const linkInIOB: ComlinkProtocol.IOB[] = [];
      /**结果列表的实际长度 */
      let linkInIOBLength = 0;
      /**是否已经完成中断 */
      let isRejected = false;

      /// 解析所有的参数
      for (let index = 0; index < linkIn.length; index++) {
        const item = linkIn[index];
        transfer.Any2InOutBinary(
          (ret) => {
            if (isRejected) {
              return;
            }
            if (ret.isError) {
              isRejected = true;
              if (hasOut) {
                hasOut.bindIOB(
                  {
                    type: IOB_Type.Clone,
                    data: ret.error,
                  },
                  true,
                );
              } else {
                throw ret.error;
                // console.error("uncatch error:", ret.error);
              }
              return;
            }
            /// 保存解析结果
            linkInIOB[index] = ret.data;
            linkInIOBLength += 1;
            /// 完成所有任务，执行指令发送
            if (linkInIOBLength === linkIn.length) {
              doReq(linkInIOB);
            }
          },
          item,
          this.core.$pushToRemote,
        );
      }
    }
  }

  /**
   * 主动生成引用代理
   * @param port
   * @param refId
   */
  private _createHolderByRefId<T>(
    port: ComlinkProtocol.BinaryPort,
    refId: number,
    iob: ComlinkProtocol.IOB,
  ) {
    const holder = this._getHolder<T>(port, refId, iob);
    return holder.toAsyncValue();
  }

  private _getHolder<T>(port: ComlinkProtocol.BinaryPort, refId: number, iob: ComlinkProtocol.IOB) {
    const holder = new HolderReflect<T>(
      {
        port,
        refId,
        linkIn: [],
      },
      this.core,
    );
    holder.bindIOB(iob);
    return holder;
  }

  // linkInSenderFactory(port: ComlinkProtocol.BinaryPort, refId: number) {
  //   return <R>(
  //     linkIn: readonly [EmscriptenReflect, ...unknown[]],
  //     hasOut?: BFChainLink.HolderReflect<R> | false,
  //   ) => this.sendLinkIn(port, refId, linkIn, hasOut);
  // }

  Any2InOutBinary(
    cb: BFChainLink.Callback<ComlinkProtocol.IOB>,
    obj: unknown,
    pushToRemote: BFChainUtil.ThirdArgument<ModelTransfer<ComlinkAsync>["Any2InOutBinary"]>,
  ) {
    const reflectHolder = getHolderReflect(obj);
    if (reflectHolder !== undefined) {
      const iob = reflectHolder.getIOB();
      if (!iob) {
        /// 还没有绑定，那么就等待其绑定完成
        return reflectHolder.toValueSync((valRet) => {
          if (valRet.isError) {
            return cb(valRet);
          }
          this.Any2InOutBinary(cb, obj, pushToRemote);
        });
        // throw new TypeError(`reflectHolder ${reflectHolder.name} no bind iob`);
      }
      if (iob.type === IOB_Type.Clone) {
        obj = iob.data;
      }
    }
    return super.Any2InOutBinary(cb, obj, pushToRemote);
  }

  InOutBinary2Any(bin: ComlinkProtocol.IOB): unknown {
    const { port, importStore, exportStore } = this.core;
    switch (bin.type) {
      //   case LinkItemType.Default:
      //     return defaultCtx;
      case IOB_Type.Locale:
        const loc = exportStore.getObjById(bin.locId) || exportStore.getSymById(bin.locId);
        if (!loc) {
          throw new ReferenceError();
        }
        return loc;
      case IOB_Type.Ref:
      case IOB_Type.RemoteSymbol:
        /// 读取缓存中的应用对象
        let cachedHolder = importStore.getProxyById(bin.refId);
        if (cachedHolder === undefined) {
          /// 使用导入功能生成对象
          cachedHolder = this._createHolderByRefId<symbol | Object>(port, bin.refId, bin);
        }
        return cachedHolder;
      case IOB_Type.Clone:
        return bin.data;
    }
    throw new TypeError();
  }
}
