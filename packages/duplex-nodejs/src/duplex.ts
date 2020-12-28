import { MessagePort, MessageChannel, threadId } from "worker_threads";
import {
  MESSAGE_TYPE,
  REMOTE_MODE,
  // SAB_CHUNK_HELPER,
  SAB_EVENT_HELPER,
  SAB_HELPER,
  SAB_MSG_STATUS,
  SAB_MSG_TYPE,
} from "./const";
import { serialize, deserialize } from "v8";
import { AtomicsNotifyer } from "./AtomicsNotifyer";

type SABS = { locale: SharedArrayBuffer; remote: SharedArrayBuffer };

const PORT_SABS_WM = new WeakMap<MessagePort, SABS>();

export class DuplexFactory implements BFChainComlink.DuplexFactory {
  /**作为子线程运作 */
  static async asCluster(workerSelf: Pick<MessagePort, "addListener" | "removeListener">) {
    let sabs: SABS | undefined;
    const port2 = await new Promise<MessagePort>((resolve, reject) => {
      const onMessage = (data: unknown) => {
        if (data instanceof MessagePort) {
          resolve(data);
          workerSelf.removeListener("message", onMessage);
        } else if (
          data instanceof Array &&
          data[0] instanceof SharedArrayBuffer &&
          data[1] instanceof SharedArrayBuffer
        ) {
          sabs = { locale: data[0], remote: data[1] };
        }
      };
      workerSelf.addListener("message", onMessage);
    });
    if (sabs) {
      PORT_SABS_WM.set(port2, sabs);
    }
    const duplex = new Duplex<ComlinkProtocol.TB>(port2);

    return duplex;
  }

  constructor(private _mc = new MessageChannel()) {}
  private _duplex?: Duplex<ComlinkProtocol.TB>;

  private _getSabs(port: MessagePort) {
    let sabs = PORT_SABS_WM.get(port);
    if (undefined === sabs) {
      try {
        sabs = {
          locale: new SharedArrayBuffer(1024), // 使用1kb的内存用做传输数据的带宽
          remote: new SharedArrayBuffer(1024), // 使用1kb的内存用做传输数据的带宽
        };
        PORT_SABS_WM.set(port, sabs);
      } catch {}
    }
    return sabs;
  }
  /**创建出专门用于传输协议数据的双工通道 */
  create() {
    let duplex = this._duplex;
    if (!duplex) {
      this._getSabs(this._mc.port1);
      duplex = new Duplex<ComlinkProtocol.TB>(this._mc.port1);
      this._duplex = duplex;
    }
    return duplex;
  }
  /**作为主线程运作 */
  asMain(workerIns: Pick<MessagePort, "postMessage">) {
    const sabs = this._getSabs(this._mc.port1);
    if (sabs) {
      try {
        workerIns.postMessage([sabs.remote, sabs.locale]);
      } catch {
        PORT_SABS_WM.delete(this._mc.port1);
      }
    }

    workerIns.postMessage(this._mc.port2, [this._mc.port2]);
  }
}

class DataPkg {
  constructor(public readonly name: string, public readonly sab: SharedArrayBuffer) {}
  public readonly si32 = new Int32Array(this.sab);
  public readonly su8 = new Uint8Array(this.sab);
  public readonly su16 = new Uint16Array(this.sab);
}
export class Duplex<TB> implements BFChainComlink.Channel.Duplex<TB> {
  static getPort(duplex: Duplex<any>) {
    return duplex._port;
  }
  private _sync: {
    sabs: SABS;
    localeDataPkg: DataPkg;
    remoteDataPkg: DataPkg;
  };
  constructor(private _port: MessagePort) {
    Reflect.set(globalThis, "duplex", this);
    this.supportModes.add("async");
    const sabs = PORT_SABS_WM.get(_port);
    if (sabs === undefined) {
      throw new TypeError();
    }
    this.supportModes.add("sync");

    const localeDataPkg = new DataPkg("locale", sabs.locale);
    const remoteDataPkg = new DataPkg("remote", sabs.remote);

    this._sync = {
      sabs,
      localeDataPkg,
      remoteDataPkg,
    };

    _port.on("message", (data) => {
      if (data instanceof Array) {
        /// Atomic.notify
        this._checkRemote();
      }
    });
  }
  /**发送异步消息 */
  postAsyncMessage(msg: BFChainComlink.Channel.DuplexMessage<TB>) {
    this._postMessageCallback(
      (hook) => {
        this._notifyer.waitCallback(
          hook.si32,
          SAB_HELPER.SI32_MSG_TYPE,
          hook.curMsgType,
          hook.next,
        );
      },
      (hook) => {
        this._notifyer.waitCallback(hook.si32, SAB_HELPER.SI32_MSG_TYPE, hook.msgType, hook.next);
      },
      msg,
    );
  }

  private _notifyer = new AtomicsNotifyer(this._port);

  postSyncMessage(msg: BFChainComlink.Channel.DuplexMessage<TB>) {
    this._postMessageCallback(
      (hook) => {
        this._checkRemote();
        // console.debug(threadId, "+openSAB");
        Atomics.wait(hook.si32, SAB_HELPER.SI32_MSG_TYPE, hook.curMsgType);
        // console.debug(threadId, "-openSAB");
        hook.next();
      },
      (hook) => {
        this._checkRemote();
        // console.debug(threadId, "+waitSAB");
        // 进入等待
        Atomics.wait(hook.si32, SAB_HELPER.SI32_MSG_TYPE, hook.msgType);
        // console.debug(threadId, "-waitSAB");
        hook.next();
      },
      msg,
    );
  }
  waitMessage() {
    do {
      // 等待对方开始响应
      Atomics.wait(this._sync.remoteDataPkg.si32, SAB_HELPER.SI32_MSG_TYPE, SAB_MSG_TYPE.FREE);
      // 处理响应的内容
      const msg = this._checkRemote();
      if (msg) {
        return msg;
      }
    } while (true);
  }

  private _eventId = new Uint32Array(1);
  private _postMessageCallback(
    onApplyWrite: (ctx: PostMessage_ApplyWrite_HookArg) => unknown,
    onChunkReady: (ctx: PostMessage_ChunkReady_HookArg) => unknown,
    msg: BFChainComlink.Channel.DuplexMessage<TB>,
  ) {
    // console.debug("postMessage", threadId, msg);
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
        // 直接申请
        const cur_msg_type = Atomics.compareExchange(
          si32,
          SAB_HELPER.SI32_MSG_TYPE,
          SAB_MSG_TYPE.FREE,
          SAB_MSG_TYPE.EVENT,
        );
        /// 申请成功
        if (cur_msg_type === SAB_MSG_TYPE.FREE) {
          // 开始写入状态
          Atomics.store(si32, SAB_HELPER.SI32_MSG_STATUS, SAB_MSG_STATUS.WRITING);
          doWriteChunk();
          return;
        }

        // 直接申请失败，转交给外部，让外部去申请
        onApplyWrite({
          si32,
          msgType: SAB_MSG_TYPE.EVENT,
          curMsgType: cur_msg_type,
          next: checkAndApplyWrite,
        });
      };
      /**获取写入权后，写入数据 */
      const doWriteChunk = () => {
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
          Math.max(msgBinary.byteLength, (msgOffset += MSG_MAX_BYTELENGTH)),
        );
        // 写入数据包的大小
        si32[SAB_EVENT_HELPER.U32_MSG_CHUNK_SIZE_INDEX] = msgChunk.byteLength;
        // 写入数据
        su8.set(msgChunk, SAB_EVENT_HELPER.U8_MSG_DATA_OFFSET);

        // 写入完成
        Atomics.store(si32, SAB_HELPER.SI32_MSG_STATUS, SAB_MSG_STATUS.FINISH);

        // 广播变更
        this._notifyer.notify(si32, [SAB_HELPER.SI32_MSG_TYPE, SAB_HELPER.SI32_MSG_STATUS]);

        // 钩子参数
        const hook: PostMessage_ChunkReady_HookArg = {
          msgType: SAB_MSG_TYPE.EVENT,
          si32,
          chunkId,
          chunkCount,
          next: tryWriteChunk,
        };
        // 累加分包ID
        chunkId++;

        // 告知外部，写入完成了
        onChunkReady(hook);
      };

      // 开始尝试写入
      tryWriteChunk();
    }
    //#endregion
  }

  /**主动检测远端是否发来消息 */
  private _checkRemote() {
    const { remoteDataPkg } = this._sync!;
    /// 如果本地还未收到消息，而且远端的堆栈信息不为空，那么就可以开始处理
    if (this._needOnMessage(remoteDataPkg)) {
      return this._onMessage(remoteDataPkg);
    }
  }

  private _chunkCollection = new Map<number, CachedChunkInfo>();

  /**是否需要处理消息 */
  private _needOnMessage(dataPkg: DataPkg) {
    if (dataPkg.si32[SAB_HELPER.SI32_MSG_TYPE] !== SAB_MSG_TYPE.FREE) {
      do {
        const cur_msg_status = dataPkg.si32[SAB_HELPER.SI32_MSG_STATUS];
        if (cur_msg_status === SAB_MSG_STATUS.FINISH) {
          break;
        }
        // console.debug(threadId, "+needOnMessage");
        Atomics.wait(dataPkg.si32, SAB_HELPER.SI32_MSG_STATUS, cur_msg_status);
        // console.debug(threadId, "-needOnMessage");
      } while (true);
      return true;
    }
    return false;
  }

  /**处理消息指令 */
  private _onMessage(dataPkg: DataPkg) {
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
          let cachedChunkInfo: CachedChunkInfo | undefined;
          let msgBinary: Uint8Array | undefined;
          /// 单包
          if (1 === chunkCount) {
            msgBinary = new Uint8Array(chunk);
          } else {
            /// 分包
            cachedChunkInfo = this._chunkCollection.get(eventId);
            if (cachedChunkInfo) {
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
                msgBinary = _u8Concat(ArrayBuffer, chunkList);
              }
            } else {
              cachedChunkInfo = new Map();
              cachedChunkInfo.set(chunkId, new Uint8Array(chunk));
            }
          }

          // 释放调度
          // this._closeSAB(si32);
          Atomics.store(si32, SAB_HELPER.SI32_MSG_TYPE, SAB_MSG_TYPE.FREE);
          this._notifyer.notify(si32, [SAB_HELPER.SI32_MSG_TYPE]);

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
    // console.debug("onMessage", threadId, msgBinary);
    let msg: BFChainComlink.Channel.DuplexMessage<TB>;
    try {
      switch (msgBinary[0]) {
        case MESSAGE_TYPE.REQ:
          msg = {
            msgType: "REQ",
            msgId: u32Reader
              .setByU8(msgBinary.subarray(1, 5 /* Uint32Array.BYTES_PER_ELEMENT+1 */))
              .getU32(),
            msgContent: deserialize(msgBinary.subarray(5)),
          };
          break;
        case MESSAGE_TYPE.RES:
          msg = {
            msgType: "RES",
            msgId: u32Reader
              .setByU8(msgBinary.subarray(1, 5 /* Uint32Array.BYTES_PER_ELEMENT+1 */))
              .getU32(),
            msgContent: deserialize(msgBinary.subarray(5)),
          };
          break;
        case MESSAGE_TYPE.SIM:
          msg = {
            msgType: "SIM",
            msgId: undefined,
            msgContent: deserialize(msgBinary.subarray(2)),
          };
          break;
        default:
          throw new TypeError(`unknown msgType:'${msgBinary[0]}'`);
      }
    } catch (err) {
      debugger;
      throw err;
    }
    for (const cb of this._cbs) {
      cb(msg);
    }
    return msg;
  }

  readonly supportModes = new Set<"async" | "sync">();
  private _cbs: Array<(data: BFChainComlink.Channel.DuplexMessage<TB>) => unknown> = [];
  onMessage(cb: (data: BFChainComlink.Channel.DuplexMessage<TB>) => unknown) {
    this._cbs.push(cb);
  }

  /// 消息序列化
  // private _msg_ABC: typeof SharedArrayBuffer | typeof ArrayBuffer = ArrayBuffer;
  private _serializeMsg(msg: BFChainComlink.Channel.DuplexMessage<TB>) {
    let msgBinary: Uint8Array;
    if (msg.msgType === "SIM") {
      msgBinary = _u8Concat(ArrayBuffer, [[MESSAGE_TYPE.SIM], serialize(msg.msgContent)]);
    } else {
      msgBinary = _u8Concat(ArrayBuffer, [
        [msg.msgType === "REQ" ? MESSAGE_TYPE.REQ : MESSAGE_TYPE.RES],
        new Uint8Array(new Uint32Array([msg.msgId]).buffer),
        serialize(msg.msgContent),
      ]);
    }
    return msgBinary;
  }
}

function _u8Concat(ABC: typeof SharedArrayBuffer | typeof ArrayBuffer, u8s: ArrayLike<number>[]) {
  let totalLen = 0;
  for (const u8 of u8s) {
    totalLen += u8.length;
  }
  const u8a = new Uint8Array(new ABC(totalLen));
  let offsetLen = 0;
  for (const u8 of u8s) {
    u8a.set(u8, offsetLen);
    offsetLen += u8.length;
  }
  return u8a;
}

class U32Reader {
  private _u32 = new Uint32Array(1);
  private _u8 = new Uint8Array(this._u32.buffer);
  setByU8(u8: Uint8Array) {
    this._u8.set(u8);
    return this;
  }
  getU32() {
    return this._u32[0];
  }
}
const u32Reader = new U32Reader();

type CachedChunkInfo = Map<number, Uint8Array>; // { chunk: Uint8Array; range: [{ start: number; end: number }] };
type PostMessage_ApplyWrite_HookArg = {
  si32: Int32Array;
  msgType: SAB_MSG_TYPE;
  curMsgType: SAB_MSG_TYPE;
  next: () => void;
};
type PostMessage_ChunkReady_HookArg = {
  si32: Int32Array;
  msgType: SAB_MSG_TYPE;
  chunkCount: number;
  chunkId: number;
  next: () => void;
};
