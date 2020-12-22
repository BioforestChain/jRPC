/**
 * 占位符存储器
 *
 * 当下进程需要一个对象来代表将来会导入到当下进程的时，
 * 就需要创建一个占位符号，主动将任务发送过去。
 * 对方响应后，告知占位符背后真正存储的内容是什么。
 *
 * 在同步模式下，也许不需要，因为彼此使用调用堆栈已经隐性实现了占位的功能，
 * 但这个功能在异步模式下尤为重要。
 * 所以同样的，它也能作用于 同步与异步 双模式下。
 */
export class HolderStore {
  constructor(public readonly name: string) {}
  private accId = 0;
  createPid() {
    return new PlaceId(_INNER_PLACE_ID_TOKEN);
  }
  private _opwm = new WeakMap<object, PlaceId>();
  private _powm = new WeakMap<PlaceId, unknown>();
  markAsHolder(obj: object) {
    const pid = this.createPid();
    this._opwm.set(obj, pid);
    this._powm.set(pid, obj);
  }
  getPidByHolder(obj: object) {
    return this._opwm.get(obj) as PlaceId | undefined;
  }
  getHolderByPid<T>(pid: PlaceId) {
    return this._powm.get(pid) as T | undefined;
  }
  isHolder(obj: unknown) {
    return this._opwm.has(obj as any);
  }
  isPid(pid: unknown) {
    return this._powm.has(pid as any);
  }
  //   saveValueByHolderId(obj){

  //   }
  importValueByPid<T = unknown>(pid: PlaceId): T {
    throw new Error("Method not implemented.");
  }
  exportValueAsPid<T>(pid: PlaceId, val: T): T {
    throw new Error("Method not implemented.");
  }
}
// export const HOLDER_MARKER = Symbol("holderMarker");

const _INNER_PLACE_ID_TOKEN = Symbol("private pid");
export class PlaceId {
  private static _accId = 0;
  public readonly id = PlaceId._accId++;
  constructor(privateToken: typeof _INNER_PLACE_ID_TOKEN) {
    if (_INNER_PLACE_ID_TOKEN !== privateToken) {
      throw new Error("use holderStore.createPid");
    }
  }
}
// export type PlaceId = typeof PlaceId
