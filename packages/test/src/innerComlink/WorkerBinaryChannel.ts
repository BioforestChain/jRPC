import { serialize, deserialize } from "v8";
import type { MessagePort } from "worker_threads";
import { appendFileSync } from "fs";
import { format } from "util";
import { threadId } from "worker_threads";

const print = (f: any, ...param: any[]) => {
  // appendFileSync(
  //   "./comlink-debug.log",
  //   new Date().toLocaleTimeString() + ":\t" + format(`[${threadId}]`, f, ...param) + "\n",
  // );
};

export class ShareBinaryChannel<TB> {
  constructor(
    private _notifyer: MessagePort,
    public readonly localSab = new SharedArrayBuffer(1024),
    public readonly remoteSab = new SharedArrayBuffer(1024),
  ) {}

  public readonly port = new ShareBinaryPort<TB>(this._notifyer, this.localSab, this.remoteSab);
}

class DataPkg {
  constructor(public readonly sab: SharedArrayBuffer) {}
  public readonly si32 = new Int32Array(this.sab);
  public readonly su8 = new Uint8Array(this.sab);
  private static _cache = new WeakMap<SharedArrayBuffer, DataPkg>();
  static from(sab: SharedArrayBuffer) {
    let cache = this._cache.get(sab);
    if (!cache) {
      cache = new DataPkg(sab);
      this._cache.set(sab, cache);
    }
    return cache;
  }
}
const enum U8_OFFSET {
  DATA_BEGIN = 4 /* Int32Array.BYTES_PER_ELEMENT */ * 2,
}

class ShareBinaryPort<TB> implements BFChainComlink.BinaryPort<TB> {
  constructor(
    private _notifyer: MessagePort,
    private localSab: SharedArrayBuffer,
    private remoteSab: SharedArrayBuffer,
  ) {
    _notifyer.on("message", (msg) => {
      this._checkRemote();
    });
  }
  /**主动检测远端是否发来消息 */
  private _checkRemote() {
    /// 如果堆栈不为空，那么就可以开始处理
    if (this.processingRemote === false && this.remoteDataPkg.si32[0] !== 0) {
      this.processingRemote = true;
      this._onMessage(this.remoteDataPkg);
      this.processingRemote = false;
    }
  }

  private localDataPkg = DataPkg.from(this.localSab);
  private remoteDataPkg = DataPkg.from(this.remoteSab);
  private processingRemote = false;
  private get currentDataPkg() {
    return this.processingRemote ? this.remoteDataPkg : this.localDataPkg;
  }

  /**处理消息指令 */
  private _onMessage(dataPkg: DataPkg) {
    const { si32, su8 } = dataPkg;
    const len = si32[1];
    print("onmg", si32[0], si32[1]);
    const bin = deserialize(su8.subarray(U8_OFFSET.DATA_BEGIN, len + U8_OFFSET.DATA_BEGIN));
    this._messageHanlder((ret) => {
      if (ret.isError) {
        throw ret.error;
      }

      const res = ret.data;
      if (res) {
        const buf = serialize(res);
        si32[1] = buf.length;
        su8.set(buf, U8_OFFSET.DATA_BEGIN);
      } else {
        si32[1] = 0;
      }

      /// 完成任务，将任务出栈，并且通知回去
      si32[0] -= 1;
      print("resp", si32[0], si32[1]);
      Atomics.notify(si32, 0, 1);
    }, bin);
  }
  private _messageHanlder!: BFChainComlink.BinaryPort.MessageListener<TB>;
  onMessage(listener: BFChainComlink.BinaryPort.MessageListener<TB>) {
    this._messageHanlder = listener;
  }
  // private _U8_DATA_BEGIN = Int32Array.BYTES_PER_ELEMENT * 2;
  req(cb: BFChainComlink.Callback<TB>, bin: TB) {
    try {
      const resBin = this.send(bin);
      if (!resBin) {
        throw new TypeError();
      }
      cb({ isError: false, data: resBin });
    } catch (error) {
      cb({ isError: true, error });
    }
  }
  send(bin: TB): TB | undefined {
    const { currentDataPkg: dataPkg } = this;
    const { si32, su8, sab } = dataPkg;
    /// 预备发起请求，将任务堆栈+1，并将请求内容写入缓冲区中
    const stackLen = (si32[0] += 1);
    const buf = serialize(bin);
    si32[1] = buf.length;
    su8.set(buf, U8_OFFSET.DATA_BEGIN);
    print("send", si32[0], si32[1]);

    if (stackLen === 1) {
      // 如果是一次完全新的请求，那么采用 notifyer.postMessage 进行通知
      this._notifyer.postMessage(1);
    } else {
      // 否则我们主动将对方唤醒
      Atomics.notify(si32, 0, 1);
    }

    do {
      // 因为自己即将睡眠，所以手动检查远端节点是否有主动发起的任务。PS：可能已经发来了，但因为JS事件循环的特性所以还没有触发 message 事件，所以这里在睡眠前先把事情做了
      this._checkRemote();
      // 当前线程进入休眠，等待对方回应信息
      Atomics.wait(si32, 0, stackLen);
      print("wait", si32[0], si32[1]);

      /// 对方唤醒我们，检查堆栈数，如果回到了发出前的数量，那么就是返回响应了
      if (si32[0] === stackLen - 1) {
        const len = si32[1];
        if (len !== 0) {
          print("resm", si32[0], si32[1]);
          return deserialize(su8.subarray(U8_OFFSET.DATA_BEGIN, len + U8_OFFSET.DATA_BEGIN));
        }
        return;
      }

      // 否则就是对方在响应我们之前发起了其它请求，那么我们需要先处理请求
      this._onMessage(dataPkg);
    } while (true);
  }
  //   readStream: AsyncIterator<TB>;
  //   write(bin: TB) {
  //     if (this.remoteQuene.quene) {
  //       this.remoteQuene.quene.resolve(bin);
  //     } else {
  //       this.remoteQuene.cache.push(bin);
  //     }
  //   }
  //   private _closed = false;
  //   close() {
  //     if (this._closed) {
  //       return;
  //     }
  //     this._closed = true;
  //     this.write = () => {};
  //     const doneValue = Promise.resolve({
  //       done: true,
  //       value: undefined,
  //     } as const);
  //     this.readStream.next = () => doneValue;
  //   }
}
