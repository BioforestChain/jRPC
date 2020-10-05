export class SimpleBinaryChannel<TB> {
  private _turnA = new _InnerTurn<TB>();
  private _turnB = new _InnerTurn<TB>();
  public readonly portA = new SimpleBinaryPort<TB>(this._turnA, this._turnB);
  public readonly portB = new SimpleBinaryPort<TB>(this._turnB, this._turnA);
}
class _InnerTurn<TB> {
  postMessage(bin: TB): TB | undefined {
    return;
  }
}
class SimpleBinaryPort<TB> implements BFChainComlink.BinaryPort<TB> {
  constructor(protected localTurn: _InnerTurn<TB>, protected remoteTurn: _InnerTurn<TB>) {}

  onMessage(cb: (bin: TB) => TB | undefined) {
    this.localTurn.postMessage = cb;
  }
  req(bin: TB): TB {
    const resBin = this.remoteTurn.postMessage(bin);
    if (!resBin) {
      throw new TypeError();
    }
    return resBin;
  }
  send(bin: TB): TB | undefined {
    return this.remoteTurn.postMessage(bin);
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
