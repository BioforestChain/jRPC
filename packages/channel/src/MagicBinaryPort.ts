import { helper } from "@bfchain/comlink-core";

export abstract class MagicBinaryPort<TB> implements BFChainComlink.BinaryPort<TB> {
  constructor(protected _duplex: BFChainComlink.Channel.Duplex<TB>) {
    _duplex.onMessage((msg) => {
      if (msg.msgType === "RES") {
        const resId = msg.msgId;
        const output = this._resMap.get(resId);
        if (!output) {
          console.error("no found responser");
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

          this._postModeMessage({
            msgType: "RES",
            msgId: reqId,
            msgContent: ret,
          });
        }, msg.msgContent);
      }
    });
  }

  protected _reqId = new Uint32Array(1);
  protected _resMap = new Map<number, BFChainComlink.Callback<TB>>();

  private _reqHandler!: BFChainComlink.BinaryPort.MessageListener<TB>;
  onMessage(listener: BFChainComlink.BinaryPort.MessageListener<TB>) {
    this._reqHandler = listener;
  }
  protected abstract _postModeMessage(msg: BFChainComlink.Channel.DuplexMessage<TB>): void;
  abstract req(output: BFChainComlink.Callback<TB>, bin: TB): void;
  send(bin: TB) {
    this._duplex.postAsyncMessage({
      msgType: "SIM",
      msgId: undefined,
      msgContent: bin,
    });
  }
}

export class SyncBinaryPort<TB> extends MagicBinaryPort<TB> {
  protected _postModeMessage(msg: BFChainComlink.Channel.DuplexMessage<TB>) {
    this._duplex.postSyncMessage(msg);
  }
  req(output: BFChainComlink.Callback<TB>, bin: TB) {
    const reqId = this._reqId[0]++;
    let hasOutput = false;
    const reqOutput: BFChainComlink.Callback<TB> = (ret) => {
      hasOutput = true;
      output(ret);
    };
    // 先存放回调
    this._resMap.set(reqId, reqOutput);
    // 发送，同步模式会直接触发回调
    this._postModeMessage({
      msgType: "REQ",
      msgId: reqId,
      msgContent: bin,
    });
    /// 同步模式：发送完成后，马上就需要对方有响应才意味着 postMessage 完成
    while (hasOutput === false) {
      this._duplex.waitMessage();
    }
  }
}
export class AsyncBinaryPort<TB> extends MagicBinaryPort<TB> {
  protected _postModeMessage(msg: BFChainComlink.Channel.DuplexMessage<TB>) {
    this._duplex.postAsyncMessage(msg);
  }
  req(output: BFChainComlink.Callback<TB>, bin: TB) {
    const reqId = this._reqId[0]++;
    this._resMap.set(reqId, output);
    this._postModeMessage({
      msgType: "REQ",
      msgId: reqId,
      msgContent: bin,
    });
  }
}
