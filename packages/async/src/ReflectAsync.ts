import { EmscriptenReflect } from "@bfchain/comlink-typings";
import { cacheGetter } from "@bfchain/util-decorator";
import { CallbackToAsync, CallbackToAsyncBind } from "./helper";

let ID_ACC = 0;
export class ReflectAsync<T /* extends object */>
  implements BFChainComlink.ReflectAsync<T> {
  constructor(
    private reflectSender: <R>(
      cb: BFChainComlink.Callback<R>,
      linkIn: [EmscriptenReflect, ...unknown[]],
      hasOut: boolean,
    ) => void,
    public source?: T,
  ) {}
  private _id = ID_ACC++;

  // toPrimitive(): PromiseLike<BFChainComlink.AsyncUtil.Primitive<T>> {
  //   throw new Error();
  // }
  applySync(
    cb: BFChainComlink.Callback<BFChainComlink.AsyncValue<BFChainComlink.AsyncUtil.ReturnType<T>>>,
    thisArgument: unknown,
    argumentsList: BFChainComlink.AsyncUtil.Parameters<T>,
  ) {
    return this.reflectSender(cb, [EmscriptenReflect.Apply, thisArgument, ...argumentsList], true);
  }
  @cacheGetter
  get apply() {
    return CallbackToAsyncBind(this.applySync, this);
  }

  constructSync(
    cb: BFChainComlink.Callback<
      BFChainComlink.AsyncValue<BFChainComlink.AsyncUtil.InstanceType<T>>
    >,
    argumentsList: BFChainComlink.AsyncUtil.ConstructorParameters<T>,
    newTarget?: unknown,
  ) {
    return this.reflectSender(cb, [EmscriptenReflect.Construct, newTarget, ...argumentsList], true);
  }
  @cacheGetter
  get construct() {
    return CallbackToAsyncBind(this.constructSync, this);
  }

  definePropertySync<K extends BFChainComlink.AsyncUtil.PropertyKey<T>>(
    cb: BFChainComlink.Callback<boolean>,
    propertyKey: K,
    attributes: BFChainComlink.AsyncUtil.PropertyDescriptor<T, K>,
  ) {
    return this.reflectSender(
      cb,
      [EmscriptenReflect.DefineProperty, propertyKey, attributes],
      false,
    );
  }
  @cacheGetter
  get defineProperty() {
    return CallbackToAsyncBind(this.definePropertySync, this);
  }

  deletePropertySync(
    cb: BFChainComlink.Callback<boolean>,
    propertyKey: BFChainComlink.AsyncUtil.PropertyKey<T>,
  ) {
    return this.reflectSender(cb, [EmscriptenReflect.DeleteProperty, propertyKey], false);
  }
  @cacheGetter
  get deleteProperty() {
    return CallbackToAsyncBind(this.deletePropertySync, this);
  }

  getSync<K extends BFChainComlink.AsyncUtil.PropertyKey<T>>(
    cb: BFChainComlink.Callback<BFChainComlink.AsyncValue<T[K]>>,
    propertyKey: K,
  ) {
    return this.reflectSender(cb, [EmscriptenReflect.Get, propertyKey], true);
  }
  @cacheGetter
  get get() {
    return CallbackToAsyncBind(this.getSync, this);
  }

  multiGetSync<Ks extends PropertyKey[]>(
    cb: BFChainComlink.Callback<
      BFChainComlink.AsyncValue<BFChainComlink.AsyncUtil.ObjectPaths<T, Ks>>
    >,
    propertyKeys: Ks,
  ) {
    const linkIn: [EmscriptenReflect, ...PropertyKey[]] = [EmscriptenReflect.Multi];
    for (const key of propertyKeys) {
      linkIn.push(2, EmscriptenReflect.Get, key);
    }
    return this.reflectSender(cb, linkIn, true);
  }
  @cacheGetter
  get multiGet() {
    return CallbackToAsyncBind(this.multiGetSync, this);
  }

  getOwnPropertyDescriptorSync<K extends BFChainComlink.AsyncUtil.PropertyKey<T>>(
    cb: BFChainComlink.Callback<
      BFChainComlink.AsyncValue<BFChainComlink.AsyncUtil.PropertyDescriptor<T, K> | undefined>
    >,
    propertyKey: BFChainComlink.AsyncUtil.PropertyKey<T>,
  ) {
    return this.reflectSender(cb, [EmscriptenReflect.GetOwnPropertyDescriptor, propertyKey], true);
  }
  @cacheGetter
  get getOwnPropertyDescriptor() {
    return CallbackToAsyncBind(this.getOwnPropertyDescriptorSync, this);
  }

  getPrototypeOfSync<P = unknown>(cb: BFChainComlink.Callback<BFChainComlink.AsyncValue<P>>) {
    return this.reflectSender(cb, [EmscriptenReflect.GetPrototypeOf], true);
  }
  @cacheGetter
  get getPrototypeOf() {
    return CallbackToAsyncBind(this.getPrototypeOfSync, this);
  }

  hasSync(
    cb: BFChainComlink.Callback<boolean>,
    propertyKey: BFChainComlink.AsyncUtil.PropertyKey<T>,
  ) {
    return this.reflectSender(cb, [EmscriptenReflect.Has, propertyKey], true);
  }
  @cacheGetter
  get has() {
    return CallbackToAsyncBind(this.hasSync, this);
  }

  isExtensibleSync(cb: BFChainComlink.Callback<boolean>) {
    return this.reflectSender(cb, [EmscriptenReflect.IsExtensible], true);
  }
  @cacheGetter
  get isExtensible() {
    return CallbackToAsyncBind(this.isExtensibleSync, this);
  }

  ownKeysSync(
    cb: BFChainComlink.Callback<
      BFChainComlink.AsyncValue<BFChainComlink.AsyncUtil.PropertyKey<T>[]>
    >,
  ) {
    return this.reflectSender(cb, [EmscriptenReflect.OwnKeys], true);
  }
  @cacheGetter
  get ownKeys() {
    return CallbackToAsyncBind(this.ownKeysSync, this);
  }

  preventExtensionsSync(cb: BFChainComlink.Callback<boolean>) {
    return this.reflectSender(cb, [EmscriptenReflect.PreventExtensions], true);
  }
  @cacheGetter
  get preventExtensions() {
    return CallbackToAsyncBind(this.preventExtensionsSync, this);
  }
  setSync<K extends BFChainComlink.AsyncUtil.PropertyKey<T>>(
    cb: BFChainComlink.Callback<boolean>,
    propertyKey: K,
    value: BFChainComlink.AsyncValue<T[K]> | T[K],
  ) {
    return this.reflectSender(cb, [EmscriptenReflect.Set, propertyKey, value], true);
  }
  @cacheGetter
  get set() {
    return CallbackToAsyncBind(this.setSync, this);
  }
  setPrototypeOfSync(cb: BFChainComlink.Callback<boolean>, proto: unknown) {
    return this.reflectSender(cb, [EmscriptenReflect.SetPrototypeOf, proto], true);
  }
  @cacheGetter
  get setPrototypeOf() {
    return CallbackToAsyncBind(this.setPrototypeOfSync, this);
  }
}
