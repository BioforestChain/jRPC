import { helper } from "@bfchain/comlink-core";

export class MagicBinaryChannel<TB> {
  constructor(
    private _duplex: BFChainComlink.Channel.Duplex<TB>,
    public readonly localSab = new SharedArrayBuffer(1024),
    public readonly remoteSab = new SharedArrayBuffer(1024),
  ) {}

  public readonly port = new MagicBinaryPort<TB>(this._duplex);
}

class MagicBinaryPort<TB> implements BFChainComlink.BinaryPort<TB> {
  constructor(private _duplex: BFChainComlink.Channel.Duplex<TB>) {
    _duplex.onMessage((msg) => {
      if (msg.msgType === "RES") {
        const resId = msg.msgId;
        const output = this._resMap.get(resId);
        if (!output) {
          console.warn("no found responser");
          return;
        }
        this._resMap.delete(resId);

        const ret = msg.msgContent;
        helper.SyncForCallback(output, () => {
          const resBin = helper.OpenArg(ret);
          if (!resBin) {
            throw new TypeError();
          }
          return resBin;
        });
      } else {
        const reqId = msg.msgId;
        this._reqHandler((ret) => {
          if (reqId === undefined) {
            return;
          }

          this._duplex.postMessage({
            msgType: "RES",
            msgId: reqId,
            msgContent: ret,
          });
        }, msg.msgContent);
      }
    });
  }

  private _reqId = new Uint32Array(1);
  private _resMap = new Map<number, BFChainComlink.Callback<TB>>();

  private _reqHandler!: BFChainComlink.BinaryPort.MessageListener<TB>;
  onMessage(listener: BFChainComlink.BinaryPort.MessageListener<TB>) {
    this._reqHandler = listener;
  }
  req(output: BFChainComlink.Callback<TB>, bin: TB) {
    const reqId = this._reqId[0]++;
    this._duplex.postMessage({
      msgType: "REQ",
      msgId: reqId,
      msgContent: bin,
    });
    this._resMap.set(reqId, output);
  }
  send(bin: TB) {
    this._duplex.postMessage({
      msgType: "SIM",
      msgId: undefined,
      msgContent: bin,
    });
  }
}
