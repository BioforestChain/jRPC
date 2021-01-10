import { AsyncBinaryPort, MagicBinaryPort, SyncBinaryPort } from "./MagicBinaryPort";

abstract class MagicBinaryChannel<TB> {
  constructor(
    protected _duplex: BFChainLink.Channel.Duplex<TB>,
    public readonly localSab = new SharedArrayBuffer(1024),
    public readonly remoteSab = new SharedArrayBuffer(1024),
  ) {}

  public abstract readonly port: MagicBinaryPort<TB>; // = new MagicBinaryPort<TB>(this._duplex);
}

export class SyncBinaryChannel<TB> extends MagicBinaryChannel<TB> {
  public readonly port = new SyncBinaryPort<TB>(this._duplex);
}

export class AsyncBinaryChannel<TB> extends MagicBinaryChannel<TB> {
  public readonly port = new AsyncBinaryPort<TB>(this._duplex);
}
