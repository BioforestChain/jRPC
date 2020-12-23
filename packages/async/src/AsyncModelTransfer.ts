import {
  globalSymbolStore,
  IMPORT_FUN_EXTENDS_SYMBOL,
  IOB_EFT_Factory_Map,
  IOB_Extends_Function_ToString_Mode,
  IOB_Extends_Object_Status,
  IOB_Extends_Type,
  IOB_Type,
  ModelTransfer,
  refFunctionStaticToStringFactory,
} from "@bfchain/comlink-protocol";
import { EmscriptenReflect, isObj, LinkObjType } from "@bfchain/comlink-typings";
import type { ComlinkAsync } from "./ComlinkAsync";
import { createHolderProxyHanlder } from "./AsyncValueProxy";
import { helper, STORE_TYPE } from "@bfchain/comlink-core";
import { HolderReflect } from "./HolderReflect";
import { safePromiseThen } from "@bfchain/util-extends-promise";

export class AsyncModelTransfer extends ModelTransfer<ComlinkAsync> {
  constructor(core: ComlinkAsync) {
    super(core);
  }

  /**
   * ref fun statis toString
   */
  private _rfsts = refFunctionStaticToStringFactory();

  /**这里保持使用cb风格，可以确保更好的性能
   * @TODO 内部的函数也应该尽可能使用cb风格来实现
   */
  sendLinkIn<R = unknown>(
    port: ComlinkProtocol.BinaryPort,
    targetId: number,
    linkIn: readonly unknown[],
    hasOut?: BFChainComlink.HolderReflect<R> | false,
  ) {
    const { transfer } = this.core;

    const doReq = () => {
      port.req(
        async (ret) => {
          const bin = helper.OpenArg(ret);
          const linkObj = transfer.transferableBinary2LinkObj(bin);

          if (linkObj.type !== LinkObjType.Out) {
            throw new TypeError();
          }

          if (linkObj.isThrow) {
            const err_iob = linkObj.out.slice().pop();
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
            const res_iob = linkObj.out.slice().pop();
            if (!res_iob) {
              throw new TypeError();
            }
            hasOut.bindIOB(res_iob);
          }
        },
        transfer.linkObj2TransferableBinary({
          type: LinkObjType.In,
          // reqId,
          targetId,
          in: linkIn.map((a) => transfer.Any2InOutBinary(a)),
          hasOut: hasOut !== undefined,
        }),
      );
    };

    /// 准备开始执行任务前，要确保参数已经全部resolve了
    const doReject = hasOut
      ? (err: unknown) => {
          hasOut.bindIOB(
            {
              type: IOB_Type.Clone,
              data: err,
            },
            true,
          );
        }
      : (err: unknown) => {
          console.error("uncatch error:", err);
        };

    /// 前置任务集合
    const preTasks = new Set<HolderReflect<unknown>>();
    let successTaskCount = 0;
    const tryResolve = (ret: BFChainComlink.CallbackArg<unknown>) => {
      if (ret.isError) {
        return doReject(ret.error);
      }
      successTaskCount += 1;
      if (successTaskCount === preTasks.size) {
        doReq();
      }
    };

    for (const maybeHolder of linkIn) {
      const reflect = HolderReflect.getHolderReflect(maybeHolder as never);
      /// 寻找还没有返回结果的任务。这里先统一加完，再单独对preTasks进行循环，避免通讯是同步的，直接导致回调完成进行任务触发
      if (reflect && reflect.isBindedIOB() === false) {
        preTasks.add(reflect);
      }
    }

    // 无需等待，那么直接执行任务
    if (preTasks.size === 0) {
      doReq();
    } else {
      for (const reflect of preTasks) {
        reflect.toValueSync(tryResolve);
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
  //     hasOut?: BFChainComlink.HolderReflect<R> | false,
  //   ) => this.sendLinkIn(port, refId, linkIn, hasOut);
  // }

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
