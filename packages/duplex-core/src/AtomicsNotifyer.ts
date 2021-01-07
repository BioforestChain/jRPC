import { cacheGetter, cleanGetterCache } from "@bfchain/util-decorator";
import { REMOTE_MODE, SAB_HELPER, SIMPLEX_MSG_TYPE } from "./const";

export class AtomicsNotifyer {
  constructor(private _port: BFChainComlink.Duplex.Endpoint) {
    this._port.onMessage((data) => {
      if (data[0] === SIMPLEX_MSG_TYPE.NOTIFY) {
        const indexs = data.subarray(1);
        for (const index of indexs) {
          const cbs = this._icbs.get(index);
          if (cbs !== undefined) {
            this._icbs.delete(index);
            for (const cb of cbs) {
              cb();
            }
          }
        }
      }
    });
  }
  private _icbs = new Map<SAB_HELPER, Array<() => void>>();

  waitCallback(si32: Int32Array, index: SAB_HELPER, value: number, cb: () => void) {
    if (si32[index] !== value) {
      return cb();
    }
    let cbs = this._icbs.get(index);
    if (cbs === undefined) {
      cbs = [cb];
      this._icbs.set(index, cbs);
    } else {
      cbs.push(cb);
    }
  }

  private _remoteMode = REMOTE_MODE.UNKNOWN;
  set remoteMode(mode: REMOTE_MODE) {
    if (this._remoteMode !== mode) {
      this._remoteMode = mode;
      cleanGetterCache(this, "notify");
    }
  }
  get remoteMode() {
    return this._remoteMode;
  }
  @cacheGetter
  get notify() {
    if (this._remoteMode === REMOTE_MODE.ASYNC) {
      return this._notify_async;
    }
    if (this._remoteMode === REMOTE_MODE.SYNC) {
      return this._notify_sync;
    }
    return this._notify_unknow;
  }
  private _notify_unknow(si32: Int32Array, indexs: SAB_HELPER[]) {
    this._notify_async(si32, indexs);
    this._notify_sync(si32, indexs);
  }
  private _notify_async(si32: Int32Array, indexs: SAB_HELPER[]) {
    const simMsg = new Uint8Array([SIMPLEX_MSG_TYPE.NOTIFY, ...indexs]);
    this._port.postMessage(simMsg, [simMsg.buffer]);
  }
  private _notify_sync(si32: Int32Array, indexs: SAB_HELPER[]) {
    for (const index of indexs) {
      Atomics.notify(si32, index, 1);
    }
  }
}
