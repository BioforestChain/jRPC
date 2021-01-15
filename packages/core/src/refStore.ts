import { bindThis } from "@bfchain/util-decorator";
export class RefStore implements BFChainLink.RefStore {
  private wm = new WeakMap<object, object>();
  @bindThis
  refRemote(localeObject: object, remoteObject: object) {
    this.wm.set(localeObject, remoteObject);
  }
  @bindThis
  unrefRemote(localeObject: object) {
    this.wm.delete(localeObject);
  }
  @bindThis
  getRefedObject(localeObject: object) {
    return this.wm.get(localeObject);
  }
}
