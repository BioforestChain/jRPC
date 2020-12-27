import { cacheGetter, cleanGetterCache } from "@bfchain/util-decorator";
import { REMOTE_MODE, SAB_HELPER } from "./const";
import type { MessagePort } from "worker_threads";

export class AtomicsNotifyer {
  constructor(private _port: MessagePort) {
    this._port.addListener("message", (data) => {
      if (data instanceof Array) {
        for (const index of data) {
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
  waitAsync(si32: Int32Array, index: SAB_HELPER, value: number) {
    return new Promise<void>((resolve) => {
      this.waitCallback(si32, index, value, resolve);
    });
  }
  waitCallback(si32: Int32Array, index: SAB_HELPER, value: number, cb: () => void) {
    if (Atomics.load(si32, index) !== value) {
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
    this._port.postMessage(indexs);
  }
  private _notify_sync(si32: Int32Array, indexs: SAB_HELPER[]) {
    for (const index of indexs) {
      Atomics.notify(si32, index);
    }
  }
}
