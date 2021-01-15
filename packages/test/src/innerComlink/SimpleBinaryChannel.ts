import { helper } from "@bfchain/link";

export class SimpleBinaryChannel<TB> {
  private _turnA = new _InnerTurn<TB>();
  private _turnB = new _InnerTurn<TB>();
  public readonly portA = new SimpleBinaryPort<TB>(this._turnA, this._turnB);
  public readonly portB = new SimpleBinaryPort<TB>(this._turnB, this._turnA);
}
class _InnerTurn<TB> {
  postMessage!: BFChainLink.BinaryPort.MessageListener<TB>;
  postObject!: BFChainLink.BinaryPort.ObjectListener;
}
class SimpleBinaryPort<TB> implements BFChainLink.BinaryPort<TB> {
  constructor(protected localTurn: _InnerTurn<TB>, protected remoteTurn: _InnerTurn<TB>) {}
  onObject(listener: BFChainLink.BinaryPort.ObjectListener): void {
    this.localTurn.postObject = listener;
  }
  duplexObject(objBox: object, transfer: object[]): void {
    this.remoteTurn.postObject(objBox);
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
}
