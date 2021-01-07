import { helper } from "@bfchain/comlink";
import { MessageChannel, MessagePort } from "worker_threads";

export class NativeBinaryChannel<TB> {
  private _mc = new MessageChannel();
  public readonly portA = new NativeBinaryPort<TB>(this._mc.port1);
  public readonly portB = new NativeBinaryPort<TB>(this._mc.port2);
}
const enum MESSAGE_TYPE {
  REQ,
  RES,
}
class NativeBinaryPort<TB> implements BFChainComlink.BinaryPort<TB> {
  constructor(protected remotePort: MessagePort) {
    this.remotePort.addListener("message", (data) => {
      const [type, resId, ret] = data;
      if (type !== MESSAGE_TYPE.RES) {
        return;
      }
      const output = this._resMap.get(resId);
      if (!output) {
        console.warn("no found responser");
        return;
      }
      this._resMap.delete(resId);
      helper.SyncForCallback(output, () => {
        const resBin = helper.OpenArg<TB>(ret);
        if (!resBin) {
          throw new TypeError();
        }
        return resBin;
      });
    });
  }
  onObject(listener: BFChainComlink.BinaryPort.Listener<object, unknown>): void {
    throw new Error("Method not implemented.");
  }
  duplexObject(objBox: object, transfer: object[]): void {
    throw new Error("Method not implemented.");
  }

  private _reqId = 0;
  private _resMap = new Map<number, BFChainComlink.Callback<TB>>();
  onMessage(handler: BFChainComlink.BinaryPort.MessageListener<TB>) {
    this.remotePort.addListener("message", (data) => {
      const [type, reqId, bin] = data;
      if (type !== MESSAGE_TYPE.REQ) {
        return;
      }

      handler((ret) => {
        if (reqId === undefined) {
          return;
        }
        this.remotePort.postMessage([MESSAGE_TYPE.RES, reqId, ret]);
      }, bin);
    });
  }
  duplexMessage(output: BFChainComlink.Callback<TB>, bin: TB) {
    const reqId = this._reqId++;
    this.remotePort.postMessage([MESSAGE_TYPE.REQ, reqId, bin]);
    this._resMap.set(reqId, output);
  }
  simplexMessage(bin: TB) {
    this.remotePort.postMessage([MESSAGE_TYPE.REQ, undefined, bin]);
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
