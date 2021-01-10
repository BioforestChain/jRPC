import { helper } from "@bfchain/link";
import { CallbackToSync } from "@bfchain/link-sync";

export class SimpleBinaryChannel<TB> {
  private _turnA = new _InnerTurn<TB>();
  private _turnB = new _InnerTurn<TB>();
  public readonly portA = new SimpleBinaryPort<TB>(this._turnA, this._turnB);
  public readonly portB = new SimpleBinaryPort<TB>(this._turnB, this._turnA);
}
class _InnerTurn<TB> {
  postMessage!: BFChainLink.BinaryPort.MessageListener<TB>;
}
class SimpleBinaryPort<TB> implements BFChainLink.BinaryPort<TB> {
  constructor(protected localTurn: _InnerTurn<TB>, protected remoteTurn: _InnerTurn<TB>) {}
  onObject(listener: BFChainLink.BinaryPort.Listener<object, unknown>): void {
    throw new Error("Method not implemented.");
  }
  duplexObject(objBox: object, transfer: object[]): void {
    throw new Error("Method not implemented.");
  }

  onMessage(listener: BFChainLink.BinaryPort.MessageListener<TB>) {
    this.localTurn.postMessage = listener;
  }
  duplexMessage(output: BFChainLink.Callback<TB>, bin: TB) {
    this.remoteTurn.postMessage(
      helper.SyncPiperFactory(output, (ret) => {
        const resBin = helper.OpenArg(ret);
        if (!resBin) {
          throw new TypeError();
        }
        return resBin;
      }),
      bin,
    );
  }
  simplexMessage(bin: TB) {
    this.remoteTurn.postMessage(() => {}, bin);
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
