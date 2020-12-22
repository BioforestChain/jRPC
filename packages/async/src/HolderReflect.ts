import { helper } from "@bfchain/comlink-core";
import {
  globalSymbolStore,
  IMPORT_FUN_EXTENDS_SYMBOL,
  IOB_Extends_Function_ToString_Mode,
  IOB_Extends_Object_Status,
  IOB_Extends_Type,
  IOB_Type,
  refFunctionStaticToStringFactory,
} from "@bfchain/comlink-protocol";
import { EmscriptenReflect, isObj } from "@bfchain/comlink-typings";
import { cacheGetter, cleanAllGetterCache, cleanGetterCache } from "@bfchain/util-decorator";
import { createHolderProxyHanlder } from "./AsyncValueProxy";
import type { ComlinkAsync } from "./ComlinkAsync";
import { CallbackToAsync, CallbackToAsyncBind, isNil } from "./helper";
import { ReflectForbidenMethods } from "./ReflectForbidenMethods";

const enum IOB_CACHE_STATUS {
  WAITING,
  LOCAL,
  REMOTE_REF,
  REMOTE_SYMBOL,
}

type IOB_Cacher<T> =
  | IOB_CacherWaiting
  | IOB_CacherRemote
  | IOB_CacherRemoteSymbol
  | IOB_CacherLocal<T>;
type IOB_CacherWaiting = {
  type: IOB_CACHE_STATUS.WAITING;
  waitter: BFChainComlink.Callback<void>[]; // PromiseOut<void>;
};
type IOB_CacherRemote<
  IOB extends EmscriptionLinkRefExtends.RefItem = EmscriptionLinkRefExtends.RefItem
> = {
  type: IOB_CACHE_STATUS.REMOTE_REF;
  port: ComlinkProtocol.BinaryPort;
  iob: IOB;
};
type IOB_CacherRemoteSymbol = {
  type: IOB_CACHE_STATUS.REMOTE_SYMBOL;
  port: ComlinkProtocol.BinaryPort;
  value: symbol;
  iob: EmscriptionLinkRefExtends.RemoteSymbolItem;
};
type IOB_CacherLocal<T> = {
  type: IOB_CACHE_STATUS.LOCAL;
  value: T;
  iob: EmscriptionLinkRefExtends.InOutObj.Local;
};
type IOB_CacherHasValue<T> = IOB_CacherLocal<T> | IOB_CacherRemoteSymbol;

let ID_ACC = 0;

type CallbackAsyncValue<T> = BFChainComlink.Callback<BFChainComlink.AsyncValue<T>>;

//#region 一些辅助性函数

const reflectForbidenMethods = new ReflectForbidenMethods();

const refFunctionStaticToString = refFunctionStaticToStringFactory();

/**要兼容Primitive值 */
function alwaysTrueCallbackCaller(cb: CallbackAsyncValue<boolean>) {
  return cb({ isError: false, data: true });
}
function alwaysFalseCallbackCaller(cb: CallbackAsyncValue<boolean>) {
  return cb({ isError: false, data: false });
}
function alwaysUndefinedCallbackCaller(cb: CallbackAsyncValue<undefined>) {
  return cb({ isError: false, data: undefined });
}
function end(iobCacher: never): never {
  throw new TypeError(`unknown iobCacher type: ${iobCacher}`);
}
//#endregion

export class HolderReflect<T /* extends object */> implements BFChainComlink.HolderReflect<T> {
  public readonly id = ID_ACC++;
  public readonly name = `holder_${this.id}`;
  public readonly staticMode = true;
  constructor(
    public linkInSender: <R>(
      linkIn: readonly [EmscriptenReflect, ...unknown[]],
      hasOut?: BFChainComlink.HolderReflect<R> | false,
    ) => unknown,
    public readonly core: ComlinkAsync,
    public readonly linkIn: readonly [] | readonly [EmscriptenReflect, ...unknown[]],
  ) {}

  //#region Holder特有接口

  toValueSync(cb: CallbackAsyncValue<T>) {
    let iobCacher = this._iobCacher;
    let needSend = false;
    if (iobCacher === undefined) {
      needSend = true;
      // const waitter = new PromiseOut<void>();
      iobCacher = this._iobCacher = {
        type: IOB_CACHE_STATUS.WAITING,
        waitter: [],
      };
    }
    if (iobCacher.type === IOB_CACHE_STATUS.WAITING) {
      iobCacher.waitter.push((ret) => {
        helper.OpenArg(ret);
        iobCacher = this._iobCacher;
        if (!iobCacher || iobCacher.type === IOB_CACHE_STATUS.WAITING) {
          throw new TypeError();
        }
        this.toValueSync(cb);
      });
      if (needSend) {
        if (this.linkIn.length === 0) {
          throw new TypeError();
        }
        this.linkInSender(this.linkIn as readonly [EmscriptenReflect, ...unknown[]], this);
      }
      return;
      // iobCacher = this._iobCacher;
    }

    if (iobCacher.type === IOB_CACHE_STATUS.LOCAL) {
      cb({ isError: false, data: iobCacher.value as BFChainComlink.AsyncValue<T> });
      return;
    }

    if (iobCacher.type === IOB_CACHE_STATUS.REMOTE_REF) {
      cb({ isError: false, data: this.toHolder() as BFChainComlink.AsyncValue<T> });
      return;
    }

    throw new TypeError(`unknown iob type '${iobCacher}'`);
  }

  @cacheGetter
  get toValue() {
    return CallbackToAsyncBind(this.toValueSync, this);
  }

  private _holder?: BFChainComlink.Holder<T>;
  toHolder(): BFChainComlink.Holder<T> {
    if (!this._holder) {
      this._holder = new Proxy(
        Function(`return function ${this.name}(){}`)(),
        createHolderProxyHanlder(this as any),
      ) as BFChainComlink.Holder<T>;
    }
    return this._holder;
  }

  private _iobCacher?: IOB_Cacher<T>;
  // private _isError?

  bindIOB(iob: ComlinkProtocol.IOB, port = this.core.port): void {
    const { _iobCacher: iobCacher } = this;
    /// 如果已经存在iobCacher，而且不是waiting的状态，那么重复绑定了。注意不能用`iobCacher?.type`
    if (iobCacher !== undefined && iobCacher.type !== IOB_CACHE_STATUS.WAITING) {
      throw new TypeError("already bind iob");
    }

    const { exportStore, importStore } = this.core;

    let remoteIob: EmscriptionLinkRefExtends.InOutObj.Remote | undefined;
    /// 解析iob，将之定义成local或者remote两种模式
    switch (iob.type) {
      case IOB_Type.Locale:
        const loc = exportStore.getObjById(iob.locId) || exportStore.getSymById(iob.locId);
        if (!loc) {
          throw new ReferenceError();
        }
        this._iobCacher = { type: IOB_CACHE_STATUS.LOCAL, value: (loc as unknown) as T, iob };
        break;
      case IOB_Type.Clone:
        this._iobCacher = { type: IOB_CACHE_STATUS.LOCAL, value: iob.data as T, iob };
        break;
      case IOB_Type.Ref:
        remoteIob = iob;
        this._iobCacher = { type: IOB_CACHE_STATUS.REMOTE_REF, port, iob };
        break;
      case IOB_Type.RemoteSymbol:
        remoteIob = iob;
        let sourceSym: symbol;
        const refExtends = iob.extends;
        if (refExtends.global) {
          const globalSymInfo = globalSymbolStore.get(refExtends.description);
          if (!globalSymInfo) {
            throw new TypeError();
          }
          sourceSym = globalSymInfo.sym;
        } else {
          sourceSym = refExtends.unique
            ? Symbol.for(refExtends.description)
            : Symbol(refExtends.description);
        }
        this._iobCacher = { type: IOB_CACHE_STATUS.REMOTE_SYMBOL, port, value: sourceSym, iob };
        break;
    }

    cleanAllGetterCache(this);
    if (remoteIob === undefined) {
      this.linkInSender = () => {
        throw new Error("no refId");
      };
    } else {
      // 保存引用信息
      importStore.idExtendsStore.set(remoteIob.refId, remoteIob.extends);
      /// 缓存对象
      importStore.saveProxyId(this.toHolder(), remoteIob.refId);
      this.linkInSender = this.core.transfer.linkInSenderFactory(port, remoteIob.refId);
      this.linkIn.length = 0;
    }

    iobCacher?.waitter.forEach((cb) => cb({ isError: false, data: undefined }));
  }
  getIOB(): ComlinkProtocol.IOB | undefined {
    if (this._iobCacher && this._iobCacher.type !== IOB_CACHE_STATUS.WAITING) {
      return this._iobCacher.iob;
    }
  }
  waitIOB(): PromiseLike<ComlinkProtocol.IOB> {
    throw new Error("Method not implemented.");
  }
  async throw() {
    const err = await this.toValue();
    throw err;
    // throw await this.toHolder().toString();
    // throw new Error("Method not implemented.");
  }

  createSubHolder<T>(linkIn: [EmscriptenReflect, ...unknown[]]) {
    /// 从空指令变成单指令
    if (this.linkIn.length === 0) {
      return new HolderReflect<T>(this.linkInSender, this.core, linkIn);
    }
    /// 单指令变成多指令
    if (this.linkIn[0] !== EmscriptenReflect.Multi) {
      return new HolderReflect<T>(this.linkInSender, this.core, [
        EmscriptenReflect.Multi,
        /// 加入原有的单指令
        this.linkIn.length,
        ...this.linkIn,
        /// 加入新的单指令
        linkIn.length,
        ...linkIn,
      ]);
    }

    /// 维持多指令
    return new HolderReflect<T>(this.linkInSender, this.core, [
      ...this.linkIn,
      /// 加入新的单指令
      linkIn.length,
      ...linkIn,
    ]);
  }

  private _getSubHolderPrimitiveSync<R>(
    linkIn: [EmscriptenReflect, ...unknown[]],
    cb: CallbackAsyncValue<R>,
  ) {
    this.createSubHolder<R>(linkIn).toValueSync(cb);
  }

  //#endregion

  //#region Reflect 接口

  //#region Reflect.apply

  private apply_local(
    cb: CallbackAsyncValue<BFChainComlink.AsyncUtil.ReturnType<T>>,
    thisArgument: unknown,
    argumentsList: BFChainComlink.AsyncUtil.Parameters<T>,
  ) {
    helper.resolveCallback(
      cb,
      Reflect.apply(
        ((this._iobCacher as unknown) as IOB_CacherLocal<Function>).value,
        thisArgument,
        argumentsList,
      ),
    );
  }
  private apply_remote(
    cb: CallbackAsyncValue<BFChainComlink.AsyncUtil.ReturnType<T>>,
    thisArgument: unknown,
    argumentsList: BFChainComlink.AsyncUtil.Parameters<T>,
  ) {
    this.createSubHolder<BFChainComlink.AsyncUtil.ReturnType<T>>([
      EmscriptenReflect.Apply,
      thisArgument,
      ...argumentsList,
    ]).toValueSync(cb);
  }
  @cacheGetter
  get applyCallback(): HolderReflect<T>["apply_remote"] {
    const { _iobCacher: iobCacher } = this;
    if (
      // 未知，未发送
      !iobCacher ||
      // 未知，未返回
      iobCacher.type === IOB_CACHE_STATUS.WAITING ||
      /// 已知，远端是函数
      (iobCacher.type === IOB_CACHE_STATUS.REMOTE_REF &&
        iobCacher.iob.type === IOB_Type.Ref &&
        iobCacher.iob.extends.type === IOB_Extends_Type.Function)
    ) {
      return this.apply_remote;
    }
    /// 已知，本地函数
    if (iobCacher.type === IOB_CACHE_STATUS.LOCAL && typeof iobCacher.value === "function") {
      return this.apply_local;
    }

    /// 其它
    if (
      iobCacher.type === IOB_CACHE_STATUS.REMOTE_REF ||
      iobCacher.type === IOB_CACHE_STATUS.REMOTE_SYMBOL ||
      iobCacher.type === IOB_CACHE_STATUS.LOCAL
    ) {
      return reflectForbidenMethods.apply;
    }

    /// 类型安全的非return结束
    end(iobCacher);
  }
  @cacheGetter
  get apply() {
    return CallbackToAsyncBind(this.applyCallback, this);
  }

  //#endregion

  //#region Reflect.construct

  private construct_local(
    cb: CallbackAsyncValue<BFChainComlink.AsyncUtil.InstanceType<T>>,
    argumentsList: BFChainComlink.AsyncUtil.ConstructorParameters<T>,
    newTarget?: unknown,
  ) {
    helper.resolveCallback(
      cb,
      Reflect.construct(
        ((this._iobCacher as unknown) as IOB_CacherLocal<Function>).value,
        argumentsList,
        newTarget,
      ),
    );
  }

  private construct_remote(
    cb: CallbackAsyncValue<BFChainComlink.AsyncUtil.InstanceType<T>>,
    argumentsList: BFChainComlink.AsyncUtil.ConstructorParameters<T>,
    newTarget?: unknown,
  ) {
    this.createSubHolder<BFChainComlink.AsyncUtil.InstanceType<T>>([
      EmscriptenReflect.Construct,
      newTarget,
      ...argumentsList,
    ]).toValueSync(cb);
  }

  @cacheGetter
  get constructCallback(): HolderReflect<T>["construct_remote"] {
    const { _iobCacher: iobCacher } = this;
    if (
      // 未知，未发送
      !iobCacher ||
      // 未知，未返回
      iobCacher.type === IOB_CACHE_STATUS.WAITING
    ) {
      return this.construct_remote;
    }
    /// 已知，远端是函数
    if (
      iobCacher.type === IOB_CACHE_STATUS.REMOTE_REF &&
      iobCacher.iob.type === IOB_Type.Ref &&
      iobCacher.iob.extends.type === IOB_Extends_Type.Function
    ) {
      if (iobCacher.iob.extends.canConstruct) {
        return this.construct_remote;
      }
      return reflectForbidenMethods.construct;
    }
    /// 已知，本地是函数
    if (iobCacher.type === IOB_CACHE_STATUS.LOCAL && typeof iobCacher.value === "function") {
      return this.construct_local;
    }

    /// 其它
    if (
      iobCacher.type === IOB_CACHE_STATUS.REMOTE_REF ||
      iobCacher.type === IOB_CACHE_STATUS.REMOTE_SYMBOL ||
      iobCacher.type === IOB_CACHE_STATUS.LOCAL
    ) {
      return reflectForbidenMethods.apply;
    }

    /// 类型安全的非return结束
    end(iobCacher);
  }

  @cacheGetter
  get construct() {
    return CallbackToAsyncBind(this.constructCallback, this);
  }
  //#endregion

  //#region Reflect.defineProperty

  private defineProperty_local<K extends BFChainComlink.AsyncUtil.PropertyKey<T>>(
    cb: CallbackAsyncValue<boolean>,
    propertyKey: K,
    attributes: BFChainComlink.AsyncUtil.PropertyDescriptor<T, K>,
  ) {
    helper.resolveCallback(
      cb,
      Reflect.defineProperty(
        (this._iobCacher as IOB_CacherLocal<T>).value as never,
        propertyKey,
        attributes,
      ),
    );
  }

  private defineProperty_remote<K extends BFChainComlink.AsyncUtil.PropertyKey<T>>(
    cb: CallbackAsyncValue<boolean>,
    propertyKey: K,
    attributes: BFChainComlink.AsyncUtil.PropertyDescriptor<T, K>,
  ) {
    return this._getSubHolderPrimitiveSync(
      [EmscriptenReflect.DefineProperty, propertyKey, attributes],
      cb,
    );
  }
  get definePropertyCallback(): HolderReflect<T>["defineProperty_remote"] {
    const { _iobCacher: iobCacher } = this;
    if (
      // 未知，未发送
      !iobCacher ||
      // 未知，未返回
      iobCacher.type === IOB_CACHE_STATUS.WAITING
    ) {
      return this.defineProperty_remote;
    }
    /// 已知，本地
    if (iobCacher.type === IOB_CACHE_STATUS.LOCAL) {
      return this.defineProperty_local;
    }
    /// 已知，远端

    /// 远端Symbol对象
    if (iobCacher.type === IOB_CACHE_STATUS.REMOTE_SYMBOL) {
      return reflectForbidenMethods.defineProperty;
    }
    /// 远端引用对象
    if (iobCacher.type === IOB_CACHE_STATUS.REMOTE_REF) {
      return this.defineProperty_remote;
    }

    /// 类型安全的非return结束
    end(iobCacher);
  }

  @cacheGetter
  get defineProperty() {
    return CallbackToAsyncBind(this.definePropertyCallback, this);
  }
  //#endregion

  //#region Reflect.deleteProperty

  private deleteProperty_localObject(
    cb: CallbackAsyncValue<boolean>,
    propertyKey: BFChainComlink.AsyncUtil.PropertyKey<T>,
  ) {
    helper.resolveCallback(
      cb,
      Reflect.deleteProperty((this._iobCacher as IOB_CacherLocal<T>).value as never, propertyKey),
    );
  }

  private deleteProperty_remote(
    cb: CallbackAsyncValue<boolean>,
    propertyKey: BFChainComlink.AsyncUtil.PropertyKey<T>,
  ) {
    return this._getSubHolderPrimitiveSync([EmscriptenReflect.DeleteProperty, propertyKey], cb);
  }
  get deletePropertyCallback(): HolderReflect<T>["deleteProperty_remote"] {
    const { _iobCacher: iobCacher } = this;
    if (
      // 未知，未发送
      !iobCacher ||
      // 未知，未返回
      iobCacher.type === IOB_CACHE_STATUS.WAITING ||
      /// 已知，远端的非Symbol对象
      iobCacher.type === IOB_CACHE_STATUS.REMOTE_REF
    ) {
      return this.deleteProperty_remote;
    }
    /// 已知，本地object
    if (iobCacher.type === IOB_CACHE_STATUS.LOCAL) {
      // object
      if (isObj(iobCacher.value)) {
        return this.deleteProperty_localObject;
      }
      // 本地 空值 原始值,
      return reflectForbidenMethods.deleteProperty;
    }

    /// 已知，远端Symbol,
    if (iobCacher.type === IOB_CACHE_STATUS.REMOTE_SYMBOL) {
      return reflectForbidenMethods.deleteProperty;
    }

    /// 类型安全的非return结束
    end(iobCacher);
  }

  @cacheGetter
  get deleteProperty() {
    return CallbackToAsyncBind(this.deletePropertyCallback, this);
  }
  //#endregion

  //#region Reflect.get
  private get_remoteFunction<K extends PropertyKey>(
    cb: CallbackAsyncValue<BFChainComlink.AsyncUtil.Get<T, K>>,
    propertyKey: K,
  ) {
    const iobExtends = (this._iobCacher as IOB_CacherRemote<
      EmscriptionLinkRefExtends.RefItem<EmscriptionLinkRefExtends.RefFunctionItemExtends>
    >).iob.extends;
    /// 自定义属性
    if (propertyKey === IMPORT_FUN_EXTENDS_SYMBOL) {
      return helper.resolveCallback(cb, iobExtends as never);
    }

    if (propertyKey === "name") {
      return helper.resolveCallback(cb, iobExtends.name as never);
    }
    if (propertyKey === "length") {
      return helper.resolveCallback(cb, iobExtends.length as never);
    }

    if (propertyKey === "arguments" || propertyKey === "callee" || propertyKey === "caller") {
      if (iobExtends.isStatic) {
        return helper.rejectCallback(
          cb,
          new TypeError(
            "'caller', 'callee', and 'arguments' properties may not be accessed on strict mode functions or the arguments objects for calls to them",
          ),
        );
      } else {
        /**
         * @TODO 这里的 arguments 和 caller 应该使用标准规范去实现
         * 无法用 await 来获取，需要调用者的堆栈信息来判定是否有权得到相关信息，
         */
        return helper.resolveCallback(cb, null as never);
      }
    }

    /**
     * 静态的toString模式下的本地模拟
     * 本地模拟的toString，constructor和protoype等等属性都没有绑定远程
     * 这里纯粹是为了加速，模拟远端的返回，可以不用
     * @TODO 配置成可以可选模式
     */
    if (
      propertyKey === "toString" &&
      iobExtends.toString.mode === IOB_Extends_Function_ToString_Mode.static
    ) {
      return helper.resolveCallback(cb, refFunctionStaticToString as never);
    }
    /**
     * function.prototype 属性不是只读，所以跳过，使用远端获取
     * @TODO 改进 BFChainComlink.AsyncUtil.Remote 的规则
     */
    return this.get_remote(cb, propertyKey);
  }

  private get_local<K extends PropertyKey>(
    cb: CallbackAsyncValue<BFChainComlink.AsyncUtil.Get<T, K>>,
    propertyKey: K,
  ) {
    const iobCacher = this._iobCacher as IOB_CacherLocal<T & object>;
    helper.resolveCallback(cb, Reflect.get(iobCacher.value, propertyKey));
  }

  private get_remote<K extends PropertyKey>(
    cb: CallbackAsyncValue<BFChainComlink.AsyncUtil.Get<T, K>>,
    propertyKey: K,
  ) {
    this._getSubHolderPrimitiveSync([EmscriptenReflect.Get, propertyKey], cb);
  }

  get getCallback(): HolderReflect<T>["get_remote"] {
    const { _iobCacher: iobCacher } = this;
    if (
      // 未知，未发送
      !iobCacher ||
      // 未知，未返回
      iobCacher.type === IOB_CACHE_STATUS.WAITING
    ) {
      return this.get_remote;
    }

    /// 已知，远端
    if (iobCacher.type === IOB_CACHE_STATUS.REMOTE_REF) {
      // function对象
      if (
        iobCacher.iob.type === IOB_Type.Ref &&
        iobCacher.iob.extends.type === IOB_Extends_Type.Function
      ) {
        return this.get_remoteFunction;
      }

      // object
      return this.get_remote;
    }

    /// 已知, 远端Symbol、本地
    if (iobCacher.type === IOB_CACHE_STATUS.REMOTE_SYMBOL) {
      return reflectForbidenMethods.get;
    }

    if (iobCacher.type === IOB_CACHE_STATUS.LOCAL) {
      if (isObj(iobCacher.value)) {
        return this.get_local;
      }
      return reflectForbidenMethods.get;
    }

    /// 类型安全的非return结束
    end(iobCacher);
  }

  @cacheGetter
  get get() {
    return CallbackToAsyncBind(this.getCallback, this);
  }
  //#endregion

  //#region Reflect.multiGetSync

  // multiGetSync<Ks extends PropertyKey[]>(
  //   cb: CallbackAsyncValue<BFChainComlink.AsyncUtil.ObjectPaths<T, Ks>>,
  //   propertyKeys: Ks,
  // ) {
  //   const linkIn: [EmscriptenReflect, ...PropertyKey[]] = [EmscriptenReflect.Multi];
  //   for (const key of propertyKeys) {
  //     linkIn.push(2, EmscriptenReflect.Get, key);
  //   }
  //   return this._getSubHolderPrimitiveSync(linkIn, cb);
  // }
  // @cacheGetter
  // get multiGet() {
  //   return CallbackToAsyncBind(this.multiGetSync, this);
  // }
  //#endregion

  //#region Reflect.getOwnPropertyDescriptor

  private getOwnPropertyDescriptor_remoteFunction<
    K extends BFChainComlink.AsyncUtil.PropertyKey<T>
  >(
    cb: CallbackAsyncValue<BFChainComlink.AsyncUtil.PropertyDescriptor<T, K> | undefined>,
    propertyKey: K,
  ) {
    const iobExtends = (this._iobCacher as IOB_CacherRemote<
      EmscriptionLinkRefExtends.RefItem<EmscriptionLinkRefExtends.RefFunctionItemExtends>
    >).iob.extends;

    if (propertyKey === "name") {
      return helper.resolveCallback(cb, {
        value: iobExtends.name,
        writable: false,
        enumerable: false,
        /* 远端的函数名，暂时强制不支持改名 */
        configurable: false,
      } as never);
    }
    if (propertyKey === "length") {
      return helper.resolveCallback(cb, {
        value: iobExtends.length,
        writable: false,
        enumerable: false,
        /* 远端的函数名，暂时强制不支持length */
        configurable: false,
      } as never);
    }

    if (propertyKey === "arguments" || propertyKey === "callee" || propertyKey === "caller") {
      /**
       * iobExtends.isStatic === any
       * @TODO 这里的 arguments 和 caller 应该使用标准规范去实现
       * 无法用 await 来获取，需要调用者的堆栈信息来判定是否有权得到相关信息
       */
      return helper.resolveCallback(cb, undefined);
    }

    /**
     * 静态的toString模式下的本地模拟
     * 本地模拟的toString，constructor和protoype等等属性都没有绑定远程
     * 这里纯粹是为了加速，模拟远端的返回，可以不用
     * @TODO 配置成可以可选模式
     */
    if (
      propertyKey === "toString" &&
      iobExtends.toString.mode === IOB_Extends_Function_ToString_Mode.static
    ) {
      return helper.resolveCallback(cb, {
        value: refFunctionStaticToString,
        writable: false,
        enumerable: false,
        /* 远端的函数名，强制修改了toString的实现 */
        configurable: false,
      } as never);
    }
    /**
     * function.prototype 属性不是只读，所以跳过，使用远端获取
     * @TODO 改进 BFChainComlink.AsyncUtil.Remote 的规则
     */
    return this.getOwnPropertyDescriptor_remote(cb, propertyKey);
  }
  private getOwnPropertyDescriptor_local<K extends BFChainComlink.AsyncUtil.PropertyKey<T>>(
    cb: CallbackAsyncValue<BFChainComlink.AsyncUtil.PropertyDescriptor<T, K> | undefined>,
    propertyKey: K,
  ) {
    const iobCacher = this._iobCacher as IOB_CacherLocal<T & object>;
    helper.resolveCallback(
      cb,
      Reflect.getOwnPropertyDescriptor(iobCacher.value, propertyKey) as never,
    );
  }
  private getOwnPropertyDescriptor_remote<K extends BFChainComlink.AsyncUtil.PropertyKey<T>>(
    cb: CallbackAsyncValue<BFChainComlink.AsyncUtil.PropertyDescriptor<T, K> | undefined>,
    propertyKey: K,
  ) {
    return this._getSubHolderPrimitiveSync<
      BFChainComlink.AsyncUtil.PropertyDescriptor<T, K> | undefined
    >([EmscriptenReflect.GetOwnPropertyDescriptor, propertyKey], cb);
  }

  get getOwnPropertyDescriptorCallback(): HolderReflect<T>["getOwnPropertyDescriptor_remote"] {
    const { _iobCacher: iobCacher } = this;
    if (
      // 未知，未发送
      !iobCacher ||
      // 未知，未返回
      iobCacher.type === IOB_CACHE_STATUS.WAITING
    ) {
      return this.getOwnPropertyDescriptor_remote;
    }

    if (iobCacher.type === IOB_CACHE_STATUS.LOCAL) {
      if (isObj(iobCacher.value)) {
        return this.getOwnPropertyDescriptor_local;
      }
      return alwaysUndefinedCallbackCaller;
    }
    if (iobCacher.type === IOB_CACHE_STATUS.REMOTE_REF) {
      if (iobCacher.iob.extends.type === IOB_Extends_Type.Function) {
        return this.getOwnPropertyDescriptor_remoteFunction;
      }
      return this.getOwnPropertyDescriptor_remote;
    }

    if (iobCacher.type === IOB_CACHE_STATUS.REMOTE_SYMBOL) {
      return alwaysUndefinedCallbackCaller;
    }

    /// 类型安全的非return结束
    end(iobCacher);
  }

  getOwnPropertyDescriptor<K extends BFChainComlink.AsyncUtil.PropertyKey<T>>(propertyKey: K) {
    return CallbackToAsync(this.getOwnPropertyDescriptorCallback, [propertyKey], this);
  }
  //#endregion

  //#region getPrototypeOf
  getPrototypeOf_local<P = unknown>(cb: CallbackAsyncValue<P>) {
    const iobCacher = this._iobCacher as IOB_CacherLocal<T & object>;
    helper.resolveCallback(cb, Reflect.getPrototypeOf(iobCacher.value) as never);
  }
  getPrototypeOf_remote<P = unknown>(cb: CallbackAsyncValue<P>) {
    return this._getSubHolderPrimitiveSync([EmscriptenReflect.GetPrototypeOf], cb);
  }
  get getPrototypeOfCallback(): HolderReflect<T>["getPrototypeOf_remote"] {
    const { _iobCacher: iobCacher } = this;
    if (
      // 未知，未发送
      !iobCacher ||
      // 未知，未返回
      iobCacher.type === IOB_CACHE_STATUS.WAITING
    ) {
      return this.getPrototypeOf_remote;
    }

    if (iobCacher.type === IOB_CACHE_STATUS.LOCAL) {
      if (isObj(iobCacher.value)) {
        return this.getPrototypeOf_local;
      }
      return reflectForbidenMethods.getPrototypeOf;
    }
    if (
      iobCacher.type === IOB_CACHE_STATUS.REMOTE_REF ||
      /**
       * 对于远端symbol，虽然本地有一个影子值，但还是要走远端获取
       */
      iobCacher.type === IOB_CACHE_STATUS.REMOTE_SYMBOL
    ) {
      return this.getPrototypeOf_remote;
    }

    /// 类型安全的非return结束
    end(iobCacher);
  }

  @cacheGetter
  get getPrototypeOf() {
    return CallbackToAsyncBind(this.getPrototypeOfCallback, this);
  }
  //#endregion

  //#region Reflect.has

  private has_remoteFunction(
    cb: CallbackAsyncValue<boolean>,
    propertyKey: BFChainComlink.AsyncUtil.PropertyKey<T>,
  ) {
    /**
     * 只要是函数（不论是否是箭头函数），就必然有这些属性
     */
    if (
      /// T1 自身属性
      propertyKey === "name" ||
      propertyKey === "length"
    ) {
      return helper.resolveCallback(cb, true);
    }

    const iobExtends = (this._iobCacher as IOB_CacherRemote<
      EmscriptionLinkRefExtends.RefItem<EmscriptionLinkRefExtends.RefFunctionItemExtends>
    >).iob.extends;

    /**
     * 被优化过的模式
     * @TODO 可以提供性能模式，来对export的函数统一进行Object.seal操作
     */
    if (
      (iobExtends.status & IOB_Extends_Object_Status.update && iobExtends.instanceOfFunction) !== 0
    ) {
      if (
        /// T2 自身属性 / 原型链
        propertyKey === "arguments" ||
        propertyKey === "callee" ||
        propertyKey === "caller" ||
        /// T3 Function.原型链
        propertyKey === "toString" ||
        propertyKey === "constructor" ||
        propertyKey === "apply" ||
        propertyKey === "bind" ||
        propertyKey === "call" ||
        propertyKey === Symbol.hasInstance ||
        /// T3 Object.原型链
        propertyKey === "toLocaleString" ||
        propertyKey === "valueOf" ||
        propertyKey === "isPrototypeOf" ||
        propertyKey === "propertyIsEnumerable" ||
        propertyKey === "hasOwnProperty"
        /// T4 非标准属性，v8引擎特有
        // __proto__,__defineGetter__,__defineSetter__,__lookupGetter__,__lookupSetter__
      ) {
        return true;
      }
    }

    /// T2 自身属性 / 原型链
    if (propertyKey === "arguments" || propertyKey === "callee" || propertyKey === "caller") {
      /// 非严格函数，属于旧版函数，必然有这些属性
      if (iobExtends.isStatic === false) {
        return helper.resolveCallback(cb, true);
      }
      /// 严格函数，可能被修改过原型链，所以也说不定
    }

    return this.has_remote(cb, propertyKey);
  }
  private has_local(
    cb: CallbackAsyncValue<boolean>,
    propertyKey: BFChainComlink.AsyncUtil.PropertyKey<T>,
  ) {
    const iobCacher = this._iobCacher as IOB_CacherLocal<T & object>;
    helper.resolveCallback(cb, Reflect.has(iobCacher.value, propertyKey));
  }
  private has_remote(
    cb: CallbackAsyncValue<boolean>,
    propertyKey: BFChainComlink.AsyncUtil.PropertyKey<T>,
  ) {
    return this._getSubHolderPrimitiveSync([EmscriptenReflect.Has, propertyKey], cb);
  }
  get hasCallback(): HolderReflect<T>["has_remote"] {
    const { _iobCacher: iobCacher } = this;
    if (
      // 未知，未发送
      !iobCacher ||
      // 未知，未返回
      iobCacher.type === IOB_CACHE_STATUS.WAITING
    ) {
      return this.has_remote;
    }

    if (iobCacher.type === IOB_CACHE_STATUS.LOCAL) {
      if (isObj(iobCacher.value)) {
        return this.has_local;
      }
      return reflectForbidenMethods.has;
    }
    if (iobCacher.type === IOB_CACHE_STATUS.REMOTE_REF) {
      if (iobCacher.iob.extends.type === IOB_Extends_Type.Function) {
        return this.has_remoteFunction;
      }
      return this.has_remote;
    }

    if (iobCacher.type === IOB_CACHE_STATUS.REMOTE_SYMBOL) {
      /// 远端的symbol和本地symbol行为是一样的，所以使用本地
      return this.has_local;
    }

    /// 类型安全的非return结束
    end(iobCacher);
  }
  @cacheGetter
  get has() {
    return CallbackToAsyncBind(this.hasCallback, this);
  }
  //#endregion

  //#region Reflect.isExtensible

  isExtensible_local(cb: CallbackAsyncValue<boolean>) {
    const iobCacher = this._iobCacher as IOB_CacherLocal<T & object>;
    helper.resolveCallback(cb, Reflect.isExtensible(iobCacher.value));
  }
  private isExtensible_remote(cb: CallbackAsyncValue<boolean>) {
    return this._getSubHolderPrimitiveSync([EmscriptenReflect.IsExtensible], cb);
  }
  get isExtensibleCallback(): HolderReflect<T>["isExtensible_remote"] {
    const { _iobCacher: iobCacher } = this;
    if (
      // 未知，未发送
      !iobCacher ||
      // 未知，未返回
      iobCacher.type === IOB_CACHE_STATUS.WAITING
    ) {
      return this.isExtensible_remote;
    }

    if (iobCacher.type === IOB_CACHE_STATUS.LOCAL) {
      if (isObj(iobCacher.value)) {
        return this.isExtensible_local;
      }
      return reflectForbidenMethods.isExtensible;
    }
    if (iobCacher.type === IOB_CACHE_STATUS.REMOTE_REF) {
      if (iobCacher.iob.extends.status & IOB_Extends_Object_Status.preventedExtensions) {
        return alwaysFalseCallbackCaller;
      }
      return this.isExtensible_remote;
    }

    if (iobCacher.type === IOB_CACHE_STATUS.REMOTE_SYMBOL) {
      /// 远端的symbol和本地symbol行为是一样的，所以使用本地
      return reflectForbidenMethods.isExtensible;
    }

    /// 类型安全的非return结束
    end(iobCacher);
  }
  @cacheGetter
  get isExtensible() {
    return CallbackToAsyncBind(this.isExtensibleCallback, this);
  }
  //#endregion

  //#region Reflect.ownKeys

  private ownKeys_local(cb: CallbackAsyncValue<BFChainComlink.AsyncUtil.PropertyKey<T>[]>) {
    const iobCacher = this._iobCacher as IOB_CacherLocal<T & object>;
    helper.resolveCallback(cb, Reflect.ownKeys(iobCacher.value) as never);
  }

  private ownKeys_remote(cb: CallbackAsyncValue<BFChainComlink.AsyncUtil.PropertyKey<T>[]>) {
    return this._getSubHolderPrimitiveSync([EmscriptenReflect.OwnKeys], cb);
  }
  get ownKeysCallback(): HolderReflect<T>["ownKeys_remote"] {
    const { _iobCacher: iobCacher } = this;
    if (
      // 未知，未发送
      !iobCacher ||
      // 未知，未返回
      iobCacher.type === IOB_CACHE_STATUS.WAITING ||
      iobCacher.type === IOB_CACHE_STATUS.REMOTE_REF
    ) {
      return this.ownKeys_remote;
    }

    if (iobCacher.type === IOB_CACHE_STATUS.LOCAL) {
      if (isObj(iobCacher.value)) {
        return this.ownKeys_local;
      }
      return reflectForbidenMethods.ownKeys;
    }
    if (iobCacher.type === IOB_CACHE_STATUS.REMOTE_SYMBOL) {
      /// 远端的symbol和本地symbol行为是一样的，所以使用本地
      return reflectForbidenMethods.ownKeys;
    }

    /// 类型安全的非return结束
    end(iobCacher);
  }

  @cacheGetter
  get ownKeys() {
    return CallbackToAsyncBind(this.ownKeysCallback, this);
  }
  //#endregion

  //#region Reflect.preventExtensions
  private preventExtensions_local(cb: CallbackAsyncValue<boolean>) {
    const iobCacher = this._iobCacher as IOB_CacherLocal<T & object>;
    helper.resolveCallback(cb, Reflect.preventExtensions(iobCacher.value));
  }

  private preventExtensions_remote(cb: CallbackAsyncValue<boolean>) {
    return this._getSubHolderPrimitiveSync([EmscriptenReflect.PreventExtensions], cb);
  }

  private preventExtensions_onceRemote(cb: CallbackAsyncValue<boolean>) {
    const iobCacher = this._iobCacher as IOB_CacherRemote;
    iobCacher.iob.extends.status &= IOB_Extends_Object_Status.preventedExtensions;
    cleanGetterCache(this, "preventExtensionsCallback");
    cleanGetterCache(this, "preventExtensions");
    return this._getSubHolderPrimitiveSync([EmscriptenReflect.PreventExtensions], cb);
  }

  @cacheGetter
  get preventExtensionsCallback(): HolderReflect<T>["preventExtensions_remote"] {
    const { _iobCacher: iobCacher } = this;
    if (
      // 未知，未发送
      !iobCacher ||
      // 未知，未返回
      iobCacher.type === IOB_CACHE_STATUS.WAITING
    ) {
      return this.preventExtensions_remote;
    }
    if (iobCacher.type === IOB_CACHE_STATUS.REMOTE_REF) {
      /// 严格模式能满足遵守规则的代码
      if (this.staticMode) {
        if ((iobCacher.iob.extends.status & IOB_Extends_Object_Status.preventedExtensions) !== 0) {
          /// 如果已经是冻结状态，那么直接返回
          return alwaysTrueCallbackCaller;
        }
        /// 非冻结状态，那么只需要触发一次也就不需要再触发，也是永久返回true
        return this.preventExtensions_onceRemote;
      }
      /**
       * 非严格模式，要考虑对方可能是Proxy对象，所以不能以当前的属性状态做判定
       */
      return this.preventExtensions_remote;
    }

    if (iobCacher.type === IOB_CACHE_STATUS.LOCAL) {
      if (isObj(iobCacher.value)) {
        return this.preventExtensions_local;
      }
      return reflectForbidenMethods.preventExtensions;
    }
    if (iobCacher.type === IOB_CACHE_STATUS.REMOTE_SYMBOL) {
      /// 远端的symbol和本地symbol行为是一样的，所以使用本地
      return reflectForbidenMethods.preventExtensions;
    }

    /// 类型安全的非return结束
    end(iobCacher);
  }

  @cacheGetter
  get preventExtensions() {
    return CallbackToAsyncBind(this.preventExtensionsCallback, this);
  }
  //#endregion

  //#region Reflect.set

  private set_local<K extends BFChainComlink.AsyncUtil.PropertyKey<T>>(
    cb: CallbackAsyncValue<boolean>,
    propertyKey: K,
    value: BFChainComlink.AsyncValue<T[K]> | T[K],
  ) {
    const iobCacher = this._iobCacher as IOB_CacherLocal<T & object>;
    helper.resolveCallback(cb, Reflect.set(iobCacher.value, propertyKey, value));
  }
  private set_remote<K extends BFChainComlink.AsyncUtil.PropertyKey<T>>(
    cb: CallbackAsyncValue<boolean>,
    propertyKey: K,
    value: BFChainComlink.AsyncValue<T[K]> | T[K],
  ) {
    return this._getSubHolderPrimitiveSync([EmscriptenReflect.Set, propertyKey, value], cb);
  }
  get setCallback(): HolderReflect<T>["set_remote"] {
    const { _iobCacher: iobCacher } = this;
    if (
      // 未知，未发送
      !iobCacher ||
      // 未知，未返回
      iobCacher.type === IOB_CACHE_STATUS.WAITING
    ) {
      return this.set_remote;
    }
    if (iobCacher.type === IOB_CACHE_STATUS.REMOTE_REF) {
      /// 严格模式能满足遵守规则的代码，如果已经是冻结状态，那么直接返回
      if (
        this.staticMode &&
        (iobCacher.iob.extends.status & IOB_Extends_Object_Status.update) !== 0
      ) {
        /// 如果已经是冻结状态，那么直接返回
        return alwaysFalseCallbackCaller;
      }
      return this.set_remote;
    }

    if (iobCacher.type === IOB_CACHE_STATUS.LOCAL) {
      if (isObj(iobCacher.value)) {
        return this.set_local;
      }
      return reflectForbidenMethods.set;
    }
    if (iobCacher.type === IOB_CACHE_STATUS.REMOTE_SYMBOL) {
      /// 远端的symbol和本地symbol行为是一样的，所以使用本地
      return reflectForbidenMethods.set;
    }

    /// 类型安全的非return结束
    end(iobCacher);
  }
  @cacheGetter
  get set() {
    return CallbackToAsyncBind(this.setCallback, this);
  }
  //#endregion

  private setPrototypeOf_local(cb: CallbackAsyncValue<boolean>, proto: unknown) {
    const iobCacher = this._iobCacher as IOB_CacherLocal<T & object>;
    helper.resolveCallback(cb, Reflect.setPrototypeOf(iobCacher.value, proto));
  }
  private setPrototypeOf_remote(cb: CallbackAsyncValue<boolean>, proto: unknown) {
    return this._getSubHolderPrimitiveSync([EmscriptenReflect.SetPrototypeOf, proto], cb);
  }
  get setPrototypeOfCallback(): HolderReflect<T>["setPrototypeOf_remote"] {
    const { _iobCacher: iobCacher } = this;
    if (
      // 未知，未发送
      !iobCacher ||
      // 未知，未返回
      iobCacher.type === IOB_CACHE_STATUS.WAITING
    ) {
      return this.setPrototypeOf_remote;
    }
    if (iobCacher.type === IOB_CACHE_STATUS.REMOTE_REF) {
      /// 严格模式能满足遵守规则的代码，如果已经是冻结状态，那么直接返回
      if (
        this.staticMode &&
        (iobCacher.iob.extends.status & IOB_Extends_Object_Status.preventedExtensions) !== 0
      ) {
        /// 如果已经是冻结状态，那么直接返回
        return alwaysFalseCallbackCaller;
      }
      return this.setPrototypeOf_remote;
    }

    if (iobCacher.type === IOB_CACHE_STATUS.LOCAL) {
      if (isObj(iobCacher.value)) {
        return this.setPrototypeOf_local;
      }
      return reflectForbidenMethods.setPrototypeOf;
    }
    if (iobCacher.type === IOB_CACHE_STATUS.REMOTE_SYMBOL) {
      /// 远端的symbol和本地symbol行为是一样的，所以使用本地
      return reflectForbidenMethods.setPrototypeOf;
    }

    /// 类型安全的非return结束
    end(iobCacher);
  }
  @cacheGetter
  get setPrototypeOf() {
    return CallbackToAsyncBind(this.setPrototypeOfCallback, this);
  }
  //#endregion

  //#region Reflect 拓展接口
  /**
   * @WARN 不支持 with 操作符与对应的 Symbol.unscopables
   */

  private asset_value<K extends PropertyKey>(
    cb: CallbackAsyncValue<BFChainComlink.AsyncUtil.Get<T, K>>,
    propertyKey: K,
  ) {
    const iobCacher = this._iobCacher as IOB_CacherHasValue<T>;
    helper.resolveCallback(cb, iobCacher.value[propertyKey as never]);
  }
  get assetCallback(): HolderReflect<T>["asset_value"] {
    const { _iobCacher: iobCacher } = this;
    if (
      // 未知，未发送
      !iobCacher ||
      // 未知，未返回
      iobCacher.type === IOB_CACHE_STATUS.WAITING
    ) {
      return this.get_remote;
    }

    /// 已知，远端
    if (iobCacher.type === IOB_CACHE_STATUS.REMOTE_REF) {
      // function对象
      if (
        iobCacher.iob.type === IOB_Type.Ref &&
        iobCacher.iob.extends.type === IOB_Extends_Type.Function
      ) {
        return this.get_remoteFunction;
      }

      // object
      return this.get_remote;
    }

    /// 已知, 远端Symbol、本地
    if (iobCacher.type === IOB_CACHE_STATUS.REMOTE_SYMBOL) {
      return this.asset_value;
    }

    if (iobCacher.type === IOB_CACHE_STATUS.LOCAL) {
      if (isNil(iobCacher.value)) {
        return reflectForbidenMethods.nilGet;
      }
      return this.asset_value;
    }

    /// 类型安全的非return结束
    end(iobCacher);
  }

  /**
   * 访问表达式，类似Reflect.get，但支持primitive
   * @param cb
   * @param propertyKey
   */
  @cacheGetter
  get asset() {
    return CallbackToAsyncBind(this.assetCallback, this);
  }

  /**支持自定义的Symbol.toPrimitive以及Symbol.toStringTag，前者优先级更高 */
  toPrimitive(hint: string) {}
  /**instanceof 的操作符，支持自定义的Symbol.hasInstance */
  Operator_instanceOf<C>(Ctor: BFChainUtil.Constructor<C>) {}
  /**typeof 的操作符*/
  Operator_typeOf() {}
  /**delete 的操作符，支持primitive*/
  Operator_delete() {}
  /**... 的操作符*/
  Operator_spread() {}
  /**in 的操作符，支持自定义的Symbol.species*/
  Operator_in() {}
  /**
   * @TIP 如果未来Emscripten支持《自定义运算符》，那么这里就需要扩展出更多的操作符了，因为这些操作都是只支持同步的。
   */

  /**支持自定义的Symbol.iterator，本地可用for await来进行迭代 */
  iterator() {}
  /**支持自定义的Symbol.asyncIterator，本地可用for await来进行迭代 */
  asyncIterator() {}

  /**支持自定义的Symbol.isConcatSpreadable */
  Array_concat() {}

  /**支持自定义的Symbol.match */
  String_match() {}
  /**支持自定义的Symbol.matchAll */
  String_matchAll() {}
  /**支持自定义的Symbol.replace */
  String_replace() {}
  /**支持自定义的Symbol.search */
  String_search() {}
  /**支持自定义的Symbol.split */
  String_split() {}

  Object_assign() {}
  Object_create() {}
  Object_defineProperties() {}
  Object_defineProperty() {}

  Object_entries() {}
  Object_freeze() {}
  Object_fromEntries() {}
  Object_getOwnPropertyDescriptor() {}

  Object_getOwnPropertyDescriptors() {}
  Object_getOwnPropertyNames() {}
  Object_getOwnPropertySymbols() {}
  Object_getPrototypeOf() {}

  Object_is() {}
  Object_isExtensible() {}
  Object_isFrozen() {}
  Object_isSealed() {}

  Object_keys() {}
  Object_preventExtensions() {}

  Object_seal() {}
  Object_setPrototypeOf() {}
  Object_values() {}
  //#endregion
}
