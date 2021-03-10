import {
  MESSAGE_TYPE,
  SAB_EVENT_HELPER,
  SAB_HELPER,
  SAB_MSG_STATUS,
  SAB_MSG_TYPE,
  SIMPLEX_MSG_TYPE,
} from "./const";

import { AtomicsNotifyer } from "./AtomicsNotifyer";
import { u8Concat } from "./helper";
import { DataPkg } from "./DataPkg";
import { u32 } from "./u32";

type TB = ComlinkProtocol.TB;
export class Duplex /* <TB> */ implements BFChainLink.Channel.Duplex<TB> {
  static getPort(duplex: Duplex /* <any> */) {
    return duplex._port;
  }
  private _sync: {
    sabs: BFChainLink.Duplex.SABS;
    localeDataPkg: DataPkg;
    remoteDataPkg: DataPkg;
  };
  constructor(private _port: BFChainLink.Duplex.Endpoint, sabs: BFChainLink.Duplex.SABS) {
    Reflect.set(globalThis, "duplex", this);
    this.supports.add("async");
    this.supports.add("sync");

    const localeDataPkg = new DataPkg("locale", sabs.locale);
    const remoteDataPkg = new DataPkg("remote", sabs.remote);

    this._sync = {
      sabs,
      localeDataPkg,
      remoteDataPkg,
    };

    _port.onMessage((data) => {
      const simplexMsgType = data[0];
      if (simplexMsgType === SIMPLEX_MSG_TYPE.NOTIFY) {
        this._tryHandleRemoteChunk();
      } else if (simplexMsgType === SIMPLEX_MSG_TYPE.TRANSFER) {
        const tobj = data[1] as object;
        for (const cb of this._tcbs) {
          cb(tobj);
        }
      }
    });
  }

  /**
   * 传输“可传送”的对象。
   * 即便当前这个通讯的底层协议是ws等非内存，也需要进行模拟实现
   */
  postAsyncObject(data: object, transfer: object[]): void {
    /// 强制传输即可
    this._port.postMessage([SIMPLEX_MSG_TYPE.TRANSFER, data], transfer);
  }
  /**发送异步消息
   * 虽然是异步发送，但消息统一走sab通道，以确保对方的处理逻辑是一致的。
   * 如果独立走nativeSimplex，对方会无法及时接收到消息，导致对方处理消息的顺序不一致。
   */
  postAsyncMessage(msg: BFChainLink.Channel.DuplexMessage<TB>) {
    this._postMessageCallback(
      {
        onApplyWrite: (hook) =>
          this._notifyer.waitCallback(hook.waitI32a, hook.waitIndex, hook.waitValue, hook.next),
        onChunkReady: (hook) =>
          this._notifyer.waitCallback(hook.waitI32a, hook.waitIndex, hook.waitValue, hook.next),
      },
      msg,
    );
  }

  private _notifyer = new AtomicsNotifyer(this._port);

  postSyncMessage(msg: BFChainLink.Channel.DuplexMessage<TB>) {
    this._postMessageCallback(
      {
        onApplyWrite: (hargs) => {
          /**
           * @TIP 这里循环把缓冲区的数据包全部清理掉，有且只需要清理一次。
           *
           * 理论上来说，两个线程使用两块共享内存是有可能在下方的wait之前出现问题，但这里使用逻辑规则进行解决：
           *
           * 在正常情况下，必须让两个进程共用同一个共享内存，并在同一时间内只有一个进程可以对其进行写入。这样才能使用Atomics来确保数据所有权的问题。
           * 但这种模式会导致两个线程会有大量时间在等待彼此的写入完成。比如我要写入数据，首先对方不能再写入才行。
           *
           * 如果双方能够独立写入，仅仅将时间花在等待对方读取并响应，那么就能将等待的时间大大缩减。
           *
           * 所以这里采用了两个独立的缓冲器来进行数据的共享。并在自己线程要进入阻塞前去判定对方是否有数据给我。
           * 同时对方也是如此，如此一来，如果我在 1.清理完一批数据 而后要 2.进入睡眠状态后，对方如果想要在则1.2.之间继续向我发来数据，必须遵守同样的规则，
           * 就是发送前它也要先进行判断：我是否有数据给它。
           *
           * 所以我只需要这样做：1.我声明我有数据给它，2.我清理它给我的数据，3.我等待它处理我的数据
           */
          this._tryGetRemoteMessageAtomics();
          Atomics.wait(hargs.waitI32a, hargs.waitIndex, hargs.waitValue);
          hargs.next();
        },
        onChunkReady: (hargs) => {
          this._tryGetRemoteMessageAtomics();
          Atomics.wait(hargs.waitI32a, hargs.waitIndex, hargs.waitValue);
          hargs.next();
        },
      },

      msg,
    );
  }
  waitMessage() {
    do {
      // 等待对方开始响应
      Atomics.wait(
        this._sync.remoteDataPkg.si32,
        SAB_HELPER.SI32_MSG_STATUS,
        SAB_MSG_STATUS.PRIVATE,
      );
      // 处理响应的内容
      const msg = this._tryGetRemoteMessageAtomics();
      if (msg) {
        return msg;
      }
    } while (true);
  }

  private _eventId = new Uint32Array(1);
  private _postMessageCallback(
    hook: {
      onApplyWrite: (ctx: BFChainLink.Duplex.PostMessage_ApplyWrite_HookArg) => unknown;
      onChunkReady: (ctx: BFChainLink.Duplex.PostMessage_ChunkReady_HookArg) => unknown;
    },
    msg: BFChainLink.Channel.DuplexMessage<TB>,
  ) {
    const msgBinary = this._serializeMsg(msg);
    const sync = this._sync!;
    const { su8, si32, su16 } = sync.localeDataPkg;

    // 数据id，用于将数据包和事件进行关联的ID
    const eventId = this._eventId[0]++;
    //#region 首先传输数据包

    {
      /// 自动分包模式
      const MSG_MAX_BYTELENGTH = su8.byteLength - SAB_EVENT_HELPER.U8_MSG_DATA_OFFSET;
      const chunkCount = Math.ceil(msgBinary.byteLength / MSG_MAX_BYTELENGTH);
      let chunkId = 0;
      let msgOffset = 0; // msgBinary.byteLength

      /**尝试写入 */
      const tryWriteChunk = () => {
        if (chunkId >= chunkCount) {
          return;
        }

        // 申请写入权
        checkAndApplyWrite();
      };
      /**申请写入权 */
      const checkAndApplyWrite = () => {
        // 申请将数据的归属权定义为私有
        if (si32[SAB_HELPER.SI32_MSG_STATUS] === SAB_MSG_STATUS.PUBLIC) {
          // 直接申请失败，转交给外部，让外部去申请
          return hook.onApplyWrite({
            waitI32a: si32,
            waitIndex: SAB_HELPER.SI32_MSG_STATUS,
            waitValue: SAB_MSG_STATUS.PUBLIC,
            next: checkAndApplyWrite,
          });
        }
        /// 申请成功，开始消息写入
        return doWriteChunk();

        // // 直接申请
        // const cur_msg_type = Atomics.compareExchange(
        //   si32,
        //   SAB_HELPER.SI32_MSG_TYPE,
        //   SAB_MSG_TYPE.FREE,
        //   SAB_MSG_TYPE.EVENT,
        // );
        // /// 申请成功
        // if (cur_msg_type === SAB_MSG_TYPE.FREE) {
        //   // 开始写入状态
        //   si32[SAB_HELPER.SI32_MSG_STATUS] = SAB_MSG_STATUS.PRIVATE;
        //   return doWriteChunk();
        // }
      };
      /**获取写入权后，写入数据 */
      const doWriteChunk = () => {
        // 写入消息类型
        si32[SAB_HELPER.SI32_MSG_TYPE] = SAB_MSG_TYPE.EVENT;
        // 写入消息ID
        si32[SAB_EVENT_HELPER.U32_EVENT_ID_INDEX] = eventId;
        // 写入总包数
        su16[SAB_EVENT_HELPER.U16_CHUNK_COUNT_INDEX] = chunkCount;
        // 写入包编号
        su16[SAB_EVENT_HELPER.U16_CHUNK_ID_INDEX] = chunkId;
        // 取出可以用于发送的数据包
        const msgChunk = msgBinary.subarray(
          msgOffset,
          // 累加偏移量
          Math.min(msgBinary.byteLength, (msgOffset += MSG_MAX_BYTELENGTH)),
        );
        // 写入数据包的大小
        si32[SAB_EVENT_HELPER.U32_MSG_CHUNK_SIZE_INDEX] = msgChunk.byteLength;
        // 写入数据
        su8.set(msgChunk, SAB_EVENT_HELPER.U8_MSG_DATA_OFFSET);

        // 写入完成
        si32[SAB_HELPER.SI32_MSG_STATUS] = SAB_MSG_STATUS.PUBLIC;

        // 广播变更
        this._notifyer.notify(si32, [SAB_HELPER.SI32_MSG_STATUS]);

        // 钩子参数
        const hookArg: BFChainLink.Duplex.PostMessage_ChunkReady_HookArg = {
          waitI32a: si32,
          waitIndex: SAB_HELPER.SI32_MSG_STATUS,
          waitValue: SAB_MSG_STATUS.PUBLIC,

          chunkId,
          chunkCount,
          next: tryWriteChunk,
        };
        // 累加分包ID
        chunkId++;

        // 告知外部，写入完成了。（现在是共有状态状态，等待对方读取完成，并归还所有权）
        hook.onChunkReady(hookArg);
      };

      // 开始尝试写入
      tryWriteChunk();
    }
    //#endregion
  }

  /**主动检测远端是否发来消息 */
  private _tryGetRemoteMessageAtomics() {
    const { remoteDataPkg } = this._sync!;
    /// 如果本地还未收到消息，而且远端的堆栈信息不为空，那么就可以开始处理
    // 如果需要处理，那么要持续交互处理才行，因为可能处理数据包的分包收发状态
    while (this._needOnMessageAtomics(remoteDataPkg)) {
      const msg = this._onChunk(remoteDataPkg);
      if (msg) {
        return msg;
      }
    }
  }
  private _tryHandleRemoteChunk() {
    const { remoteDataPkg } = this._sync!;
    /// 如果本地还未收到消息，而且远端的堆栈信息不为空，那么就可以开始处理
    if (this._needOnMessage(remoteDataPkg)) {
      return this._onChunk(remoteDataPkg);
    }
  }

  private _chunkCollection = new Map<number, BFChainLink.Duplex.CachedChunkInfo>();

  /**是否需要处理消息 */
  private _needOnMessageAtomics(dataPkg: DataPkg) {
    do {
      const cur_msg_status = dataPkg.si32[SAB_HELPER.SI32_MSG_STATUS];
      if (cur_msg_status === SAB_MSG_STATUS.PUBLIC) {
        return true;
      } else if (cur_msg_status === SAB_MSG_STATUS.PROTECTED) {
        Atomics.wait(dataPkg.si32, SAB_HELPER.SI32_MSG_STATUS, cur_msg_status);
      } else if (cur_msg_status === SAB_MSG_STATUS.PRIVATE) {
        return false;
      } else {
        throw new TypeError();
      }
    } while (true);
  }
  /**是否需要处理消息 */
  private _needOnMessage(dataPkg: DataPkg) {
    return dataPkg.si32[SAB_HELPER.SI32_MSG_STATUS] === SAB_MSG_STATUS.PUBLIC;
  }

  /**处理数据包 */
  private _onChunk(dataPkg: DataPkg) {
    const { si32, su8, su16 } = dataPkg;
    switch (si32[SAB_HELPER.SI32_MSG_TYPE]) {
      case SAB_MSG_TYPE.EVENT:
        {
          /**事件ID */
          const eventId = si32[SAB_EVENT_HELPER.U32_EVENT_ID_INDEX];
          /**分包的数量 */
          const chunkCount = su16[SAB_EVENT_HELPER.U16_CHUNK_COUNT_INDEX];
          /**数据包编号*/
          const chunkId = su16[SAB_EVENT_HELPER.U16_CHUNK_ID_INDEX];
          /**数据包大小 */
          const chunkSize = si32[SAB_EVENT_HELPER.U32_MSG_CHUNK_SIZE_INDEX];
          /**数据包 */
          const chunk = su8.subarray(
            SAB_EVENT_HELPER.U8_MSG_DATA_OFFSET,
            SAB_EVENT_HELPER.U8_MSG_DATA_OFFSET + chunkSize,
          );
          let cachedChunkInfo: BFChainLink.Duplex.CachedChunkInfo | undefined;
          let msgBinary: Uint8Array | undefined;
          /// 单包
          if (1 === chunkCount) {
            msgBinary = new Uint8Array(chunk.byteLength);
            msgBinary.set(chunk, 0);
          } else {
            /// 分包
            cachedChunkInfo = this._chunkCollection.get(eventId);
            if (cachedChunkInfo) {
              /// 保存，先默认保存sab的chunk
              cachedChunkInfo.set(chunkId, chunk);
              /// 如果数据包已经完整了，那么整理出完整的数据包
              if (cachedChunkInfo.size === chunkCount) {
                // 删除缓存
                this._chunkCollection.delete(eventId);

                /// 合并分包
                const chunkList: Uint8Array[] = [];
                /**
                 * 这里支持无序传输，如果底层使用WebRTC，可以更节省设备资源
                 */
                for (const chunkItem of cachedChunkInfo) {
                  chunkList[chunkItem[0]] = chunkItem[1];
                }
                msgBinary = u8Concat(ArrayBuffer, chunkList);
              } else {
                /// 数据还没有完结，所以把sab复制一份
                cachedChunkInfo.set(chunkId, new Uint8Array(chunk));
              }
            } else {
              cachedChunkInfo = new Map();
              // 不能直接保存sab，需要复制一份
              cachedChunkInfo.set(chunkId, new Uint8Array(chunk));
              this._chunkCollection.set(eventId, cachedChunkInfo);
            }
          }

          // 归还所有权，并释放调度权
          si32[SAB_HELPER.SI32_MSG_STATUS] = SAB_MSG_STATUS.PRIVATE;
          this._notifyer.notify(si32, [SAB_HELPER.SI32_MSG_STATUS]);

          /// 如果有完整的数据包，那么触发事件
          if (msgBinary) {
            // 触发事件
            return this._msgBinaryHandler(msgBinary);
          }
        }
        break;
    }
  }

  private _msgBinaryHandler(msgBinary: Uint8Array) {
    let msg: BFChainLink.Channel.DuplexMessage<TB>;
    try {
      switch (msgBinary[0]) {
        case MESSAGE_TYPE.REQ:
          msg = {
            msgType: "REQ",
            msgId: u32
              .setByU8(msgBinary.subarray(1, 5 /* Uint32Array.BYTES_PER_ELEMENT+1 */))
              .getU32(),
            msgContent: msgBinary.subarray(5), // deserialize(msgBinary.subarray(5)),
          };
          break;
        case MESSAGE_TYPE.RES:
          const isError = msgBinary[5] === 1;
          const msgContent: BFChainLink.CallbackArg<Uint8Array | undefined, undefined> = isError
            ? {
                isError: true,
                error: undefined,
              }
            : {
                isError: false,
                data: msgBinary.subarray(6), //deserialize(msgBinary.subarray(6))
              };
          msg = {
            msgType: "RES",
            msgId: u32
              .setByU8(msgBinary.subarray(1, 5 /* Uint32Array.BYTES_PER_ELEMENT+1 */))
              .getU32(),
            msgContent, //deserialize(msgBinary.subarray(5)),
          };
          break;
        case MESSAGE_TYPE.SIM:
          msg = {
            msgType: "SIM",
            msgId: undefined,
            msgContent: msgBinary.subarray(1), //deserialize(msgBinary.subarray(1)),
          };
          break;
        default:
          throw new TypeError(`unknown msgType:'${msgBinary[0]}'`);
      }
    } catch (err) {
      debugger;
      throw err;
    }
    for (const cb of this._mcbs) {
      cb(msg);
    }
    return msg;
  }

  readonly supports = new Set<BFChainLink.Channel.Supports>();
  private _mcbs: Array<(data: BFChainLink.Channel.DuplexMessage<TB>) => unknown> = [];
  onMessage(cb: (data: BFChainLink.Channel.DuplexMessage<TB>) => unknown) {
    this._mcbs.push(cb);
  }
  private _tcbs: Array<BFChainLink.BinaryPort.Listener<object>> = [];
  onObject(cb: BFChainLink.BinaryPort.Listener<object>) {
    this._tcbs.push(cb);
  }

  /// 消息序列化
  // private _msg_ABC: typeof SharedArrayBuffer | typeof ArrayBuffer = ArrayBuffer;
  private _serializeMsg(msg: BFChainLink.Channel.DuplexMessage<TB>) {
    let msgBinary: Uint8Array;
    if (msg.msgType === "SIM") {
      msgBinary = u8Concat(ArrayBuffer, [
        [MESSAGE_TYPE.SIM],
        msg.msgContent /* serialize(msg.msgContent) */,
      ]);
    } else if (msg.msgType === "REQ") {
      msgBinary = u8Concat(ArrayBuffer, [
        [MESSAGE_TYPE.REQ],
        new Uint8Array(new Uint32Array([msg.msgId]).buffer),
        msg.msgContent,
        // serialize(msg.msgContent),
      ]);
    } else {
      /// if (msg.msgType === "RES")
      const u8s: ArrayLike<number>[] = [
        [MESSAGE_TYPE.RES],
        new Uint8Array(new Uint32Array([msg.msgId]).buffer),
      ];
      if (msg.msgContent.isError) {
        u8s.push([1]);
      } else {
        u8s.push([0]);
        u8s.push(msg.msgContent.data || []);
      }
      msgBinary = u8Concat(ArrayBuffer, u8s);
    }
    return msgBinary;
  }
}
