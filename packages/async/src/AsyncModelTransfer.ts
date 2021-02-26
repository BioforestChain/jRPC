import { IOB_Type, ModelTransfer, refFunctionStaticToStringFactory } from "@bfchain/link-protocol";
import { EmscriptenReflect, LinkObjType } from "@bfchain/link-typings";
import type { ComlinkAsync } from "./ComlinkAsync";
import { ComlinkCore, helper, Var } from "@bfchain/link-core";
import { HolderReflect } from "./HolderReflect";
import { getHolderReflect, isHolder } from "./Holder";
import { GroupItem, LinkInGroup } from "./helper";

export class AsyncModelTransfer extends ModelTransfer<ComlinkAsync> {
  constructor(core: ComlinkAsync) {
    super(core);
  }

  appendLinkIn(
    oldLinkin: readonly [] | readonly [EmscriptenReflect, ...unknown[]],
    newLinkIn: [EmscriptenReflect, ...unknown[]],
  ): [EmscriptenReflect, ...unknown[]] {
    /// 从空指令变成单指令
    if (oldLinkin.length === 0) {
      return newLinkIn;
    }
    /// 单指令变成多指令
    if (oldLinkin[0] !== EmscriptenReflect.Multi) {
      return [
        EmscriptenReflect.Multi,
        /// 加入原有的单指令
        new Var(0), // 手动定义EsmReflectHanlder的target，Var0是默认target
        oldLinkin.length,
        ...oldLinkin,
        /// 加入新的单指令
        new Var(1), // 手动定义EsmReflectHanlder的target，Var1是上一个指令的返回值
        newLinkIn.length,
        ...newLinkIn,
      ];
    }
    /// 维持多指令
    const group = LinkInGroup.from(oldLinkin as BFChainLink.LinkIn);
    group.append(new GroupItem(new Var(group.size), newLinkIn));
    return group.toLinkIn();
    // return [
    //   ...(oldLinkin as BFChainLink.LinkIn),
    //   /// 加入新的单指令
    //   new Var(-1),
    //   newLinkIn.length,
    //   ...newLinkIn,
    // ];
  }

  /**这里保持使用cb风格，可以确保更好的性能
   * @TODO 内部的函数也应该尽可能使用cb风格来实现
   */
  sendLinkIn<R = unknown>(
    port: ComlinkProtocol.BinaryPort,
    targetId: number,
    _linkIn: readonly unknown[],
    resTransfer?: (cb: BFChainLink.Callback<ComlinkProtocol.IOB>, resList: unknown[]) => void,
    hasOut?: BFChainLink.HolderReflect<R> | false,
  ) {
    let fullLinkIn = _linkIn.slice();
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
    if (fullLinkIn.length === 0) {
      doReq(fullLinkIn as ComlinkProtocol.IOB[]);
    } else {
      // /**结果列表的实际长度 */
      // let linkInIOBLength = 0;
      /**是否已经完成中断 */
      let isRejected = false;
      /**是否是多指令模式 */
      let isMultiMode = fullLinkIn[0] === EmscriptenReflect.Multi;
      /**mutli模式下解析出来的group对象 */
      let group: LinkInGroup | undefined;
      /// 解析所有的参数
      for (let index = 0; index < fullLinkIn.length; index++) {
        const item = fullLinkIn[index];
        const reflectHolder = getHolderReflect(item);
        if (reflectHolder !== undefined && reflectHolder.isBindedIOB() === false) {
          const { linkSenderArgs } = reflectHolder;
          /// 首先确保他们能合并
          if (linkSenderArgs.port === port) {
            /// 还没有绑定，那么就使用多指令模式，将指令一并传输过去处理
            /// 如果是多指令模式下，将指令插入中间
            if (isMultiMode) {
              /// 将multi-linkIn分组
              group || (group = LinkInGroup.from(fullLinkIn));
              /// 找到目前这个参数对应的最晚起点
              let prevItemCount = 0;
              const hasItemList: GroupItem[] = [];
              for (let i = group.itemList.length - 1; i > 0; i--) {
                const groupItem = group.itemList[i];
                if (groupItem.linkIn.includes(item)) {
                  hasItemList.push(groupItem);
                  prevItemCount = i; // 这里是依赖逆序才能重复赋值
                  // break;
                }
              }
              if (hasItemList.length === 0) {
                throw new SyntaxError();
              }

              /**
               * 将新的groupItem插入
               * 这里要先进行插入，在将Holder对象的替换成Var，因为插入逻辑会对Var进行偏移
               */
              if (linkSenderArgs.refId === undefined) {
                throw new TypeError("no refId");
              }
              if (linkSenderArgs.linkIn.length === 0) {
                throw new TypeError("no linkIn");
              }
              const newGroupItem = new GroupItem(
                linkSenderArgs.refId,
                linkSenderArgs.linkIn as BFChainLink.LinkIn,
              );
              group.insert(prevItemCount, newGroupItem);

              /**
               * 将原本的Holder替换成Var
               * 因为新的GroupItem会替代现有的 groupItemList[prevItemCount] 的位置，所以它的返回值会写入到 varList[prevItemCount + 1] 中
               */
              const itemVar = new Var(prevItemCount + 1);
              for (const groupItem of hasItemList) {
                for (let i = 0; i < groupItem.linkIn.length; i++) {
                  const maybeHolder = groupItem.linkIn[i];
                  if (maybeHolder === item) {
                    groupItem.linkIn[i] = itemVar;
                  }
                }
              }

              fullLinkIn = group.toLinkIn();

              /// 将当前的位置重置为 target:var|number 所在位置
              index = newGroupItem.startIndex;
            } else {
              /// 将原本的Holder替换成Var
              fullLinkIn[index] = new Var(1);
              /// 不是多指令模式，那么就转化成多指令
              fullLinkIn.unshift(
                EmscriptenReflect.Multi,
                linkSenderArgs.refId,
                linkSenderArgs.linkIn.length,
                ...linkSenderArgs.linkIn,
                new Var(0),
                fullLinkIn.length,
              );
              isMultiMode = true;
            }

            /// 因为已知位于var，所以这里+1直接来到len的位置；等一下for循环还会+1，等于从len后面的那个开始
            index += 1;
            continue;
          }
        }
      }

      /// 开始解析，同样的key不会解析两次
      /**转换结果的缓存 */
      const transferMap = new Map<unknown, EmscriptionLinkRefExtends.InOutObj>();
      /**需要转化的所有Key */
      const transferKeys = new Set<unknown>(fullLinkIn);
      for (const item of transferKeys) {
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
            transferMap.set(item, ret.data);
            /// 完成所有任务，执行指令发送
            if (transferMap.size === transferKeys.size) {
              /**结果列表 */
              const linkInIOB = fullLinkIn.map((item) => {
                const iob = transferMap.get(item);
                if (iob === undefined) {
                  throw new TypeError();
                }
                return iob;
              });
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
      } else {
        throw new TypeError(`@TODO: fix reflectHolder.iob.type ${iob.type}`);
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
      case IOB_Type.Var:
        return new Var(bin.id);
    }
    checkNever(bin);
  }
}
