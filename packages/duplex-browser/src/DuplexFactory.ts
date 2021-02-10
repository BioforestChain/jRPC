import { Duplex } from "@bfchain/link-duplex-core";
import { Endpoint } from "./Endpoint";

const PORT_SABS_WM = new WeakMap<MessagePort, BFChainLink.Duplex.SABS>();

type _MessagePortTypeIn = Pick<MessagePort, "addEventListener" | "removeEventListener">;
type _MessagePortTypeOut = Pick<MessagePort, "postMessage">;
type _MessagePortTypeCtrl = Pick<MessagePort, "start" /* | "close" */>;

export class DuplexFactory
  implements BFChainLink.Duplex.Factory<_MessagePortTypeOut, _MessagePortTypeCtrl> {
  static createMessageChannel() {
    return new MessageChannel();
  }
  /**作为子线程运作 */
  static async asCluster(workerSelf: _MessagePortTypeIn & Partial<_MessagePortTypeCtrl>) {
    let sabs: BFChainLink.Duplex.SABS | undefined;
    const port2 = await new Promise<MessagePort>((resolve, reject) => {
      const onMessage = (me: MessageEvent) => {
        const { data } = me;
        if (data instanceof MessagePort) {
          resolve(data);
          workerSelf.removeEventListener("message", onMessage);
        } else if (
          data instanceof Array &&
          data[0] instanceof SharedArrayBuffer &&
          data[1] instanceof SharedArrayBuffer
        ) {
          sabs = { locale: data[0], remote: data[1] };
        }
      };
      workerSelf.addEventListener("message", onMessage);
      workerSelf.start?.();
    });
    if (!sabs) {
      throw new TypeError();
    }
    PORT_SABS_WM.set(port2, sabs);
    const duplex = new Duplex(new Endpoint(port2), sabs);

    return duplex;
  }

  constructor(private _mc = new MessageChannel()) {}
  private _duplex?: Duplex;

  private _getSabs(port: MessagePort) {
    let sabs = PORT_SABS_WM.get(port);
    if (undefined === sabs) {
      try {
        sabs = {
          locale: new SharedArrayBuffer(1024), // 使用1kb的内存用做传输数据的带宽
          remote: new SharedArrayBuffer(1024), // 使用1kb的内存用做传输数据的带宽
        };
        PORT_SABS_WM.set(port, sabs);
      } catch (err) {
        console.error(err);
        throw new SyntaxError("no support use SharedArrayBuffer");
      }
    }
    return sabs;
  }
  /**创建出专门用于传输协议数据的双工通道 */
  getDuplex() {
    let duplex = this._duplex;
    if (!duplex) {
      const sabs = this._getSabs(this._mc.port1);
      duplex = new Duplex(new Endpoint(this._mc.port1), sabs);
      this._duplex = duplex;
    }
    return duplex;
  }
  /**作为主线程运作 */
  asMain(workerIns: _MessagePortTypeOut & Partial<_MessagePortTypeCtrl>) {
    const sabs = this._getSabs(this._mc.port1);
    workerIns.start?.();
    try {
      workerIns.postMessage([sabs.remote, sabs.locale]);
    } catch (err) {
      console.error(err);
      throw new SyntaxError("no support use transfer SharedArrayBuffer in channel");
    }

    workerIns.postMessage(this._mc.port2, [this._mc.port2]);
  }
}
