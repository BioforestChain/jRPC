import { serialize, deserialize } from "v8";
import type { MessagePort } from "worker_threads";
import { threadId } from "worker_threads";
import { format } from "util";
import { appendFileSync } from "fs";

let log = (f: any, ...param: any[]) => {
  // console.log(f, ...param);
  // appendFileSync(
  //   "./comlink-debug.log",
  //   new Date().toLocaleTimeString() +
  //     ":\t" +
  //     format(`[${threadId}]`, f, ...param) +
  //     "\n"
  // );
};
// console.log(process.argv);

export class ShareBinaryChannel<TB> {
  constructor(
    private _notifyer: MessagePort,
    public readonly sab = new SharedArrayBuffer(1024 * 1024)
  ) {}

  public readonly port = new ShareBinaryPort<TB>(this._notifyer, this.sab);
}

class ShareBinaryPort<TB> implements BFChainComlink.BinaryPort<TB> {
  constructor(private _notifyer: MessagePort, private sab: SharedArrayBuffer) {
    _notifyer.on("message", (msg) => {
      if (msg === "qaq") {
        this._onMessage();
      }
    });
  }
  private si32 = new Int32Array(this.sab);
  private su8 = new Uint8Array(this.sab);

  /**处理消息指令 */
  private _onMessage() {
    debugger;
    log("get req", [this.si32[0], this.si32[1]]);

    const len = this.si32[1];
    const bin = deserialize(
      this.su8.subarray(this._U8_DATA_BEGIN, len + this._U8_DATA_BEGIN)
    );
    const res = this._messageHanlder(bin);
    if (res) {
      const buf = serialize(res);
      this.si32[1] = buf.length;
      this.su8.set(buf, this._U8_DATA_BEGIN);
    } else {
      this.si32[1] = 0;
    }

    log("doi res", [this.si32[0], this.si32[1]]);

    /// 完成任务，将任务出栈，并且通知回去
    this.si32[0] -= 1;
    Atomics.notify(this.si32, 0, 1);
  }
  private _messageHanlder(bin: TB): TB | undefined {
    return;
  }
  onMessage(cb: (bin: TB) => TB | undefined) {
    this._messageHanlder = cb;
  }
  private _U8_DATA_BEGIN = Int32Array.BYTES_PER_ELEMENT * 2;
  req(bin: TB): TB {
    /// 预备发起请求，将任务堆栈+1，并将请求内容写入缓冲区中
    log("pre req", [this.si32[0], this.si32[1]]);
    const stackLen = (this.si32[0] += 1);
    const buf = serialize(bin);
    this.si32[1] = buf.length;
    this.su8.set(buf, this._U8_DATA_BEGIN);

    if (stackLen === 1) {
      // 如果是一次完全新的请求，那么采用 notifyer.postMessage 进行通知
      this._notifyer.postMessage("qaq");
    } else {
      // 否则我们主动将对方唤醒
      Atomics.notify(this.si32, 0, 1);
    }

    do {
      // 当前线程进入休眠，等待对方回应信息
      Atomics.wait(this.si32, 0, stackLen);

      log("get res", [this.si32[0], this.si32[1]]);
      /// 对方唤醒我们，检查堆栈数，如果回到了发出前的数量，那么就是返回响应了
      if (this.si32[0] === stackLen - 1) {
        const len = this.si32[1];
        if (len === 0) {
          throw new TypeError();
        }
        return deserialize(
          this.su8.subarray(this._U8_DATA_BEGIN, len + this._U8_DATA_BEGIN)
        );
      }

      // 否则就是对方在响应我们之前发起了其它请求，那么我们需要先处理请求
      this._onMessage();
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
