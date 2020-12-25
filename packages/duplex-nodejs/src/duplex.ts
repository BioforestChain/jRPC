import { MessagePort, MessageChannel } from "worker_threads";
import { MESSAGE_TYPE } from "./const";
import { serialize, deserialize } from "v8";
export class DuplexFactory implements BFChainComlink.DuplexFactory {
  static async asCluster(workerSelf: Pick<MessagePort, "addListener" | "removeListener">) {
    const port2 = await new Promise<MessagePort>((resolve, reject) => {
      const onMessage = (data: unknown) => {
        if (data instanceof MessagePort) {
          resolve(data);
          workerSelf.removeListener("message", onMessage);
        }
      };
      workerSelf.addListener("message", onMessage);
    });
    const duplex = new Duplex<ComlinkProtocol.TB>(port2);
    return duplex;
  }
  constructor(private _mc = new MessageChannel()) {}
  create() {
    const duplex = new Duplex<ComlinkProtocol.TB>(this._mc.port1);
    return duplex;
  }
  asMain(workerIns: Pick<MessagePort, "postMessage">) {
    workerIns.postMessage(this._mc.port2, [this._mc.port2]);
  }
}

export class Duplex<TB> implements BFChainComlink.Channel.Duplex<TB> {
  constructor(private _port: MessagePort) {
    _port.on("message", (data: Uint8Array) => {
      let msg: BFChainComlink.Channel.DuplexMessage<TB>;
      switch (data[0]) {
        case MESSAGE_TYPE.REQ:
          msg = {
            msgType: "REQ",
            msgId: new Uint32Array(data.subarray(1, 5 /* Uint32Array.BYTES_PER_ELEMENT+1 */))[0],
            msgContent: deserialize(data.subarray(5)),
          };
          break;
        case MESSAGE_TYPE.RES:
          msg = {
            msgType: "RES",
            msgId: new Uint32Array(data.subarray(1, 5 /* Uint32Array.BYTES_PER_ELEMENT+1 */))[0],
            msgContent: deserialize(data.subarray(5)),
          };
          break;
        case MESSAGE_TYPE.SIM:
          msg = {
            msgType: "SIM",
            msgId: undefined,
            msgContent: deserialize(data.subarray(2)),
          };
          break;
        default:
          throw new TypeError(`unknown msgType:'${data[0]}'`);
      }

      for (const cb of this._cbs) {
        cb(msg);
      }
    });
  }
  private _cbs: Array<(data: BFChainComlink.Channel.DuplexMessage<TB>) => unknown> = [];
  onMessage(cb: (data: BFChainComlink.Channel.DuplexMessage<TB>) => unknown) {
    this._cbs.push(cb);
  }
  postMessage(msg: BFChainComlink.Channel.DuplexMessage<TB>) {
    let msgBinary: Uint8Array;
    if (msg.msgType === "SIM") {
      msgBinary = _u8Concat([MESSAGE_TYPE.SIM], serialize(msg.msgContent));
    } else {
      msgBinary = _u8Concat(
        [msg.msgType === "REQ" ? MESSAGE_TYPE.REQ : MESSAGE_TYPE.RES],
        new Uint8Array(new Uint32Array([msg.msgId]).buffer),
        serialize(msg.msgContent),
      );
    }
    this._port.postMessage(msgBinary, [msgBinary.buffer]);
  }
}

function _u8Concat(...u8s: ArrayLike<number>[]) {
  let totalLen = 0;
  for (const u8 of u8s) {
    totalLen += u8.length;
  }
  const u8a = new Uint8Array(totalLen);
  let offsetLen = 0;
  for (const u8 of u8s) {
    u8a.set(u8, offsetLen);
    offsetLen += u8.length;
  }
  return u8a;
}
