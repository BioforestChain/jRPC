import { helper } from "@bfchain/link-core";
import {
  globalSymbolStore,
  IMPORT_FUN_EXTENDS_SYMBOL,
  IOB_Extends_Function_ToString_Mode,
  IOB_Extends_Object_Status,
  IOB_Extends_Type,
  IOB_Type,
  refFunctionStaticToStringFactory,
} from "@bfchain/link-protocol";
import { EmscriptenReflect, isObj } from "@bfchain/link-typings";
import {
  bindThis,
  cacheGetter,
  cleanAllGetterCache,
  cleanGetterCache,
} from "@bfchain/util-decorator";
import { getHolder, getHolderReflect, isHolder } from "./Holder";
import type { ComlinkAsync } from "./ComlinkAsync";
import { CallbackToAsync, CallbackToAsyncBind, isNil } from "./helper";
import { ReflectForbidenMethods } from "./ReflectForbidenMethods";

import { IOB_CACHE_STATUS } from "./const";

let ID_ACC = 0;

type CallbackAsyncValue<T> = BFChainLink.Callback<BFChainLink.AsyncValue<T>>;

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

export class HolderReflect<T /* extends object */> implements BFChainLink.HolderReflect<T> {
  static isHolder = isHolder;
  static getHolderReflect = getHolderReflect;

  toHolder(): BFChainLink.Holder<T> {
    return getHolder(this);
  }

  public readonly id = ID_ACC++;
  public readonly name = `holder_${this.id}`;
  public readonly staticMode = true;
  constructor(
    public linkSenderArgs: Readonly<{
      linkIn: readonly [] | readonly [EmscriptenReflect, ...unknown[]];
      port: ComlinkProtocol.BinaryPort;
      refId: number | undefined;
    }>,
    // public linkInSender: <R>(
    //   linkIn: readonly [EmscriptenReflect, ...unknown[]],
    //   hasOut?: BFChainLink.HolderReflect<R> | false,
    // ) => unknown,
    public readonly core: ComlinkAsync, // public readonly linkIn: readonly [] | readonly [EmscriptenReflect, ...unknown[]],
  ) {}

  //#region Holder特有接口

  toValueSync(cb: CallbackAsyncValue<T>) {
    let iobCacher = this._iobCacher;
    let needSend = false;
    if (iobCacher === undefined) {
      needSend = true;
      iobCacher = this._iobCacher = {
        type: IOB_CACHE_STATUS.WAITING,
        waitter: [],
      };
    }
    if (iobCacher.type === IOB_CACHE_STATUS.WAITING) {
      iobCacher.waitter.push((ret) => {
        try {
          helper.OpenArg(ret);
          iobCacher = this._iobCacher;
          if (!iobCacher || iobCacher.type === IOB_CACHE_STATUS.WAITING) {
            throw new TypeError();
          }
          this.toValueSync(cb);
        } catch (error) {
          cb({ isError: true, error });
        }
      });
      if (needSend) {
        const { linkSenderArgs } = this;
        if (linkSenderArgs.linkIn.length === 0) {
          throw new TypeError();
        }
        if (linkSenderArgs.refId === undefined) {
          throw new TypeError("no refId");
        }
        this.core.transfer.sendLinkIn(
          linkSenderArgs.port,
          linkSenderArgs.refId,
          linkSenderArgs.linkIn,
          this,
        );
        // this.linkInSender(this.linkIn as readonly [EmscriptenReflect, ...unknown[]], this);
      }
      return;
      // iobCacher = this._iobCacher;
    }

    if (
      iobCacher.type === IOB_CACHE_STATUS.LOCAL ||
      iobCacher.type === IOB_CACHE_STATUS.REMOTE_SYMBOL
    ) {
      cb({ isError: false, data: iobCacher.value as BFChainLink.AsyncValue<T> });
      return;
    }

    if (iobCacher.type === IOB_CACHE_STATUS.REMOTE_REF) {
      cb({ isError: false, data: this.toHolder() as BFChainLink.AsyncValue<T> });
      return;
    }

    if (iobCacher.type === IOB_CACHE_STATUS.THROW) {
      this._getCatchedReflect().toValueSync((ret) => {
        const error = helper.OpenArg(ret);
        cb({ isError: true, error: error as never });
      });
      return;
    }

    end(iobCacher);
  }

  @cacheGetter
  get toValue() {
    return CallbackToAsyncBind(this.toValueSync, this);
  }

  toAsyncValue(): BFChainLink.AsyncValue<T> {
    const iobCacher = this._iobCacher;
    if (
      iobCacher &&
      (iobCacher.type === IOB_CACHE_STATUS.LOCAL ||
        iobCacher.type === IOB_CACHE_STATUS.REMOTE_SYMBOL)
    ) {
      return iobCacher.value as never;
    }
    return this.toHolder() as never;
  }

  private _catchedReflect?: HolderReflect<T>;
  private _getCatchedReflect() {
    let { _catchedReflect: _catched } = this;
    if (!_catched) {
      const { _iobCacher: iobCacher } = this;
      if (iobCacher?.type !== IOB_CACHE_STATUS.THROW) {
        throw new Error("no an error");
      }
      _catched = new HolderReflect<T>(this.linkSenderArgs, this.core);
      _catched.bindIOB(iobCacher.cacher.iob);
    }
    return _catched;
  }

  private _iobCacher?: BFChainLink.HolderReflect.IOB_Cacher<T>;
  // private _isError?

  bindIOB(iob: ComlinkProtocol.IOB, isError = false, port = this.core.port): void {
    const { _iobCacher: iobCacher } = this;
    /// 如果已经存在iobCacher，而且不是waiting的状态，那么重复绑定了。注意不能用`iobCacher?.type`
    if (iobCacher !== undefined && iobCacher.type !== IOB_CACHE_STATUS.WAITING) {
      throw new TypeError("already bind iob");
    }

    const { exportStore, importStore } = this.core;

    let remoteIob: EmscriptionLinkRefExtends.InOutObj.Remote | undefined;
    let newIobCacher: BFChainLink.HolderReflect.IOB_Cacher<T>;
    /// 解析iob，将之定义成local或者remote两种模式
    switch (iob.type) {
      case IOB_Type.Locale:
        const loc = exportStore.getObjById(iob.locId) || exportStore.getSymById(iob.locId);
        if (!loc) {
          throw new ReferenceError();
        }
        newIobCacher = {
          type: IOB_CACHE_STATUS.LOCAL,
          value: (loc as unknown) as T,
          iob,
        };
        break;
      case IOB_Type.Clone:
        newIobCacher = { type: IOB_CACHE_STATUS.LOCAL, value: iob.data as T, iob };
        break;
      case IOB_Type.Ref:
        remoteIob = iob;
        newIobCacher = { type: IOB_CACHE_STATUS.REMOTE_REF, port, iob };
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
        newIobCacher = {
          type: IOB_CACHE_STATUS.REMOTE_SYMBOL,
          port,
          value: sourceSym,
          iob,
        };
        break;
    }
    if (isError) {
      newIobCacher = {
        type: IOB_CACHE_STATUS.THROW,
        cacher: newIobCacher,
      };
    }
    this._iobCacher = newIobCacher;

    if (remoteIob === undefined) {
      this.linkSenderArgs = {
        ...this.linkSenderArgs,
        refId: undefined,
      };
    } else {
      // 保存引用信息
      importStore.idExtendsStore.set(remoteIob.refId, remoteIob.extends);
      /// 缓存对象
      importStore.saveProxyId(
        (isError ? this._getCatchedReflect().toAsyncValue() : this.toAsyncValue()) as never,
        remoteIob.refId,
      );
      /// 它是有指令长度的，那么清空指令；对应的，需要重新生成指令发送器
      this.linkSenderArgs = {
        ...this.linkSenderArgs,
        refId: remoteIob.refId,
        linkIn: [],
      };
    }
    /// 核心属性变更，清理所有getter缓存
    cleanAllGetterCache(this);

    iobCacher?.waitter.forEach((cb) => {
      // try {
      cb({ isError: false, data: undefined });
      // } catch (err) {
      //   console.error("uncatch error", err);
      // }
    });
  }
  getIOB(): ComlinkProtocol.IOB | undefined {
    if (this._iobCacher && this._iobCacher.type !== IOB_CACHE_STATUS.WAITING) {
      if (this._iobCacher.type === IOB_CACHE_STATUS.THROW) {
        return this._iobCacher.cacher.iob;
      }
      return this._iobCacher.iob;
    }
  }
  isBindedIOB() {
    const { _iobCacher } = this;
    if (_iobCacher && _iobCacher.type !== IOB_CACHE_STATUS.WAITING) {
      return true;
    }
    return false;
  }

  waitIOB(): PromiseLike<ComlinkProtocol.IOB> {
    throw new Error("Method not implemented.");
  }

  createSubHolder<T>(subHolderLinkIn: [EmscriptenReflect, ...unknown[]]) {
    const { linkSenderArgs } = this;
    /// 从空指令变成单指令
    if (linkSenderArgs.linkIn.length === 0) {
      return new HolderReflect<T>(
        {
          ...linkSenderArgs,
          linkIn: subHolderLinkIn,
        },
        this.core,
      );
    }
    /// 单指令变成多指令
    if (linkSenderArgs.linkIn[0] !== EmscriptenReflect.Multi) {
      return new HolderReflect<T>(
        {
          ...linkSenderArgs,
          linkIn: [
            EmscriptenReflect.Multi,
            /// 加入原有的单指令
            linkSenderArgs.linkIn.length,
            ...linkSenderArgs.linkIn,
            /// 加入新的单指令
            subHolderLinkIn.length,
            ...subHolderLinkIn,
          ],
        },
        this.core,
      );
    }

    /// 维持多指令
    return new HolderReflect<T>(
      {
        ...linkSenderArgs,
        linkIn: [
          ...linkSenderArgs.linkIn,
          /// 加入新的单指令
          subHolderLinkIn.length,
          ...subHolderLinkIn,
        ],
      },
      this.core,
    );
  }

  private _getSubHolderPrimitiveSync<R>(
    linkIn: [EmscriptenReflect, ...unknown[]],
    cb: CallbackAsyncValue<R>,
  ) {
    this.createSubHolder<R>(linkIn).toValueSync(cb);
  }

  //#endregion

  //#region Reflect 接口

  //#region throw

  private throw_binded(cb: CallbackAsyncValue<never>) {
    const iobCacher = this._iobCacher as BFChainLink.HolderReflect.IOB_CacherBinded<T>;
    if (
      iobCacher.type === IOB_CACHE_STATUS.LOCAL ||
      iobCacher.type === IOB_CACHE_STATUS.REMOTE_SYMBOL
    ) {
      helper.rejectCallback(cb, iobCacher.value as never);
      return;
    }
    if (iobCacher.type === IOB_CACHE_STATUS.REMOTE_REF) {
      helper.rejectCallback(cb, this._getCatchedReflect().toHolder() as never);
      return;
    }
    end(iobCacher);
  }
  // async throw() {
  //   const err = await this.toValue();
  //   throw err;
  //   // throw await this.toHolder().toString();
  //   // throw new Error("Method not implemented.");
  // }
  //#endregion

  //#region Reflect.apply

  private apply_local(
    cb: CallbackAsyncValue<BFChainLink.AsyncUtil.ReturnType<T>>,
    thisArgument: unknown,
    argumentsList: BFChainLink.AsyncUtil.Parameters<T>,
  ) {
    helper.resolveCallback(
      cb,
      Reflect.apply(
        ((this._iobCacher as unknown) as BFChainLink.HolderReflect.IOB_CacherLocal<Function>)
          .value,
        thisArgument,
        argumentsList,
      ),
    );
  }
  applyHolder(thisArgument: unknown, argumentsList: BFChainLink.AsyncUtil.Parameters<T>) {
    return this.createSubHolder<BFChainLink.AsyncUtil.ReturnType<T>>([
      EmscriptenReflect.Apply,
      thisArgument,
      ...argumentsList,
    ]);
  }

  private apply_remote(
    cb: CallbackAsyncValue<BFChainLink.AsyncUtil.ReturnType<T>>,
    thisArgument: unknown,
    argumentsList: BFChainLink.AsyncUtil.Parameters<T>,
  ) {
    this.applyHolder(thisArgument, argumentsList).toValueSync(cb);
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

    if (iobCacher.type === IOB_CACHE_STATUS.THROW) {
      return this.throw_binded;
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
    cb: CallbackAsyncValue<BFChainLink.AsyncUtil.InstanceType<T>>,
    argumentsList: BFChainLink.AsyncUtil.ConstructorParameters<T>,
    newTarget?: unknown,
  ) {
    helper.resolveCallback(
      cb,
      Reflect.construct(
        ((this._iobCacher as unknown) as BFChainLink.HolderReflect.IOB_CacherLocal<Function>)
          .value,
        argumentsList,
        newTarget,
      ),
    );
  }

  constructHolder(
    argumentsList: BFChainLink.AsyncUtil.ConstructorParameters<T>,
    newTarget?: unknown,
  ) {
    return this.createSubHolder<BFChainLink.AsyncUtil.InstanceType<T>>([
      EmscriptenReflect.Construct,
      newTarget,
      ...argumentsList,
    ]);
  }

  private construct_remote(
    cb: CallbackAsyncValue<BFChainLink.AsyncUtil.InstanceType<T>>,
    argumentsList: BFChainLink.AsyncUtil.ConstructorParameters<T>,
    newTarget?: unknown,
  ) {
    this.constructHolder(argumentsList, newTarget).toValueSync(cb);
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

    if (iobCacher.type === IOB_CACHE_STATUS.THROW) {
      return this.throw_binded;
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

  private defineProperty_local<K extends BFChainLink.AsyncUtil.PropertyKey<T>>(
    cb: CallbackAsyncValue<boolean>,
    propertyKey: K,
    attributes: BFChainLink.AsyncUtil.PropertyDescriptor<T, K>,
  ) {
    helper.resolveCallback(
      cb,
      Reflect.defineProperty(
        (this._iobCacher as BFChainLink.HolderReflect.IOB_CacherLocal<T>).value as never,
        propertyKey,
        attributes,
      ),
    );
  }
  definePropertyHolder<K extends BFChainLink.AsyncUtil.PropertyKey<T>>(
    propertyKey: K,
    attributes: BFChainLink.AsyncUtil.PropertyDescriptor<T, K>,
  ) {
    return this.createSubHolder<boolean>([
      EmscriptenReflect.DefineProperty,
      propertyKey,
      attributes,
    ]);
  }

  private defineProperty_remote<K extends BFChainLink.AsyncUtil.PropertyKey<T>>(
    cb: CallbackAsyncValue<boolean>,
    propertyKey: K,
    attributes: BFChainLink.AsyncUtil.PropertyDescriptor<T, K>,
  ) {
    return this.definePropertyHolder(propertyKey, attributes).toValueSync(cb);
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

    if (iobCacher.type === IOB_CACHE_STATUS.THROW) {
      return this.throw_binded;
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
    propertyKey: BFChainLink.AsyncUtil.PropertyKey<T>,
  ) {
    helper.resolveCallback(
      cb,
      Reflect.deleteProperty(
        (this._iobCacher as BFChainLink.HolderReflect.IOB_CacherLocal<T>).value as never,
        propertyKey,
      ),
    );
  }
  deletePropertyHolder(propertyKey: BFChainLink.AsyncUtil.PropertyKey<T>) {
    return this.createSubHolder<boolean>([EmscriptenReflect.DeleteProperty, propertyKey]);
  }

  private deleteProperty_remote(
    cb: CallbackAsyncValue<boolean>,
    propertyKey: BFChainLink.AsyncUtil.PropertyKey<T>,
  ) {
    this.deletePropertyHolder(propertyKey).toValueSync(cb);
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

    if (iobCacher.type === IOB_CACHE_STATUS.THROW) {
      return this.throw_binded;
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
    cb: CallbackAsyncValue<BFChainLink.AsyncUtil.Get<T, K>>,
    propertyKey: K,
  ) {
    const iobExtends = (this._iobCacher as BFChainLink.HolderReflect.IOB_CacherRemote<
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
     * @TODO 改进 BFChainLink.AsyncUtil.Remote 的规则
     */
    return this.get_remote(cb, propertyKey);
  }

  private get_local<K extends PropertyKey>(
    cb: CallbackAsyncValue<BFChainLink.AsyncUtil.Get<T, K>>,
    propertyKey: K,
  ) {
    const iobCacher = this._iobCacher as BFChainLink.HolderReflect.IOB_CacherLocal<T & object>;
    helper.resolveCallback(cb, Reflect.get(iobCacher.value, propertyKey));
  }

  getHolder<K extends PropertyKey>(propertyKey: K) {
    return this.createSubHolder<BFChainLink.AsyncUtil.Get<T, K>>([
      EmscriptenReflect.Get,
      propertyKey,
    ]);
  }
  private get_remote<K extends PropertyKey>(
    cb: CallbackAsyncValue<BFChainLink.AsyncUtil.Get<T, K>>,
    propertyKey: K,
  ) {
    this.getHolder(propertyKey).toValueSync(cb);
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

    if (iobCacher.type === IOB_CACHE_STATUS.THROW) {
      return this.throw_binded;
    }
    /// 类型安全的非return结束
    end(iobCacher);
  }

  @cacheGetter
  get get() {
    return CallbackToAsyncBind(this.getCallback, this);
  }
  //#endregion

  //#region Reflect.getOwnPropertyDescriptor

  private getOwnPropertyDescriptor_remoteFunction<
    K extends BFChainLink.AsyncUtil.PropertyKey<T>
  >(
    cb: CallbackAsyncValue<BFChainLink.AsyncUtil.PropertyDescriptor<T, K> | undefined>,
    propertyKey: K,
  ) {
    const iobExtends = (this._iobCacher as BFChainLink.HolderReflect.IOB_CacherRemote<
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
     * @TODO 改进 BFChainLink.AsyncUtil.Remote 的规则
     */
    return this.getOwnPropertyDescriptor_remote(cb, propertyKey);
  }
  private getOwnPropertyDescriptor_local<K extends BFChainLink.AsyncUtil.PropertyKey<T>>(
    cb: CallbackAsyncValue<BFChainLink.AsyncUtil.PropertyDescriptor<T, K> | undefined>,
    propertyKey: K,
  ) {
    const iobCacher = this._iobCacher as BFChainLink.HolderReflect.IOB_CacherLocal<T & object>;
    helper.resolveCallback(
      cb,
      Reflect.getOwnPropertyDescriptor(iobCacher.value, propertyKey) as never,
    );
  }

  getOwnPropertyDescriptorHolder<K extends BFChainLink.AsyncUtil.PropertyKey<T>>(
    propertyKey: K,
  ) {
    return this.createSubHolder<BFChainLink.AsyncUtil.PropertyDescriptor<T, K> | undefined>([
      EmscriptenReflect.GetOwnPropertyDescriptor,
      propertyKey,
    ]);
  }

  private getOwnPropertyDescriptor_remote<K extends BFChainLink.AsyncUtil.PropertyKey<T>>(
    cb: CallbackAsyncValue<BFChainLink.AsyncUtil.PropertyDescriptor<T, K> | undefined>,
    propertyKey: K,
  ) {
    this.getOwnPropertyDescriptorHolder(propertyKey).toValueSync(cb);
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

    if (iobCacher.type === IOB_CACHE_STATUS.THROW) {
      return this.throw_binded;
    }
    /// 类型安全的非return结束
    end(iobCacher);
  }

  getOwnPropertyDescriptor<K extends BFChainLink.AsyncUtil.PropertyKey<T>>(propertyKey: K) {
    return CallbackToAsync(this.getOwnPropertyDescriptorCallback, [propertyKey], this);
  }
  //#endregion

  //#region getPrototypeOf
  getPrototypeOf_local<P = unknown>(cb: CallbackAsyncValue<P>) {
    const iobCacher = this._iobCacher as BFChainLink.HolderReflect.IOB_CacherLocal<T & object>;
    helper.resolveCallback(cb, Reflect.getPrototypeOf(iobCacher.value) as never);
  }
  getPrototypeOfHolder<P = unknown>() {
    return this.createSubHolder<P>([EmscriptenReflect.GetPrototypeOf]);
  }
  getPrototypeOf_remote<P = unknown>(cb: CallbackAsyncValue<P>) {
    this.getPrototypeOfHolder<P>().toValueSync(cb);
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

    if (iobCacher.type === IOB_CACHE_STATUS.THROW) {
      return this.throw_binded;
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
    propertyKey: BFChainLink.AsyncUtil.PropertyKey<T>,
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

    const iobExtends = (this._iobCacher as BFChainLink.HolderReflect.IOB_CacherRemote<
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
    propertyKey: BFChainLink.AsyncUtil.PropertyKey<T>,
  ) {
    const iobCacher = this._iobCacher as BFChainLink.HolderReflect.IOB_CacherLocal<T & object>;
    helper.resolveCallback(cb, Reflect.has(iobCacher.value, propertyKey));
  }
  hasHolder(propertyKey: BFChainLink.AsyncUtil.PropertyKey<T> | PropertyKey) {
    return this.createSubHolder<boolean>([EmscriptenReflect.Has, propertyKey]);
  }

  private has_remote(
    cb: CallbackAsyncValue<boolean>,
    propertyKey: BFChainLink.AsyncUtil.PropertyKey<T> | PropertyKey,
  ) {
    return this.hasHolder(propertyKey).toValueSync(cb);
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

    if (iobCacher.type === IOB_CACHE_STATUS.THROW) {
      return this.throw_binded;
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

  private isExtensible_local(cb: CallbackAsyncValue<boolean>) {
    const iobCacher = this._iobCacher as BFChainLink.HolderReflect.IOB_CacherLocal<T & object>;
    helper.resolveCallback(cb, Reflect.isExtensible(iobCacher.value));
  }

  isExtensibleHolder() {
    return this.createSubHolder<boolean>([EmscriptenReflect.IsExtensible]);
  }
  private isExtensible_remote(cb: CallbackAsyncValue<boolean>) {
    this.isExtensibleHolder().toValueSync(cb);
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

    if (iobCacher.type === IOB_CACHE_STATUS.THROW) {
      return this.throw_binded;
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

  private ownKeys_local(cb: CallbackAsyncValue<BFChainLink.AsyncUtil.PropertyKey<T>[]>) {
    const iobCacher = this._iobCacher as BFChainLink.HolderReflect.IOB_CacherLocal<T & object>;
    helper.resolveCallback(cb, Reflect.ownKeys(iobCacher.value) as never);
  }

  ownKeysHolder() {
    return this.createSubHolder<BFChainLink.AsyncUtil.PropertyKey<T>[]>([
      EmscriptenReflect.OwnKeys,
    ]);
  }
  private ownKeys_remote(cb: CallbackAsyncValue<BFChainLink.AsyncUtil.PropertyKey<T>[]>) {
    this.ownKeysHolder().toValueSync(cb);
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

    if (iobCacher.type === IOB_CACHE_STATUS.THROW) {
      return this.throw_binded;
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
    const iobCacher = this._iobCacher as BFChainLink.HolderReflect.IOB_CacherLocal<T & object>;
    helper.resolveCallback(cb, Reflect.preventExtensions(iobCacher.value));
  }

  preventExtensionsHolder() {
    return this.createSubHolder<boolean>([EmscriptenReflect.PreventExtensions]);
  }

  private preventExtensions_remote(cb: CallbackAsyncValue<boolean>) {
    this.preventExtensionsHolder().toValueSync(cb);
  }

  private preventExtensions_onceRemote(cb: CallbackAsyncValue<boolean>) {
    const iobCacher = this._iobCacher as BFChainLink.HolderReflect.IOB_CacherRemote;
    iobCacher.iob.extends.status &= IOB_Extends_Object_Status.preventedExtensions;
    cleanGetterCache(this, "preventExtensionsCallback");
    cleanGetterCache(this, "preventExtensions");
    return this.preventExtensions_remote(cb);
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

    if (iobCacher.type === IOB_CACHE_STATUS.THROW) {
      return this.throw_binded;
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

  private set_local<K extends BFChainLink.AsyncUtil.PropertyKey<T>>(
    cb: CallbackAsyncValue<boolean>,
    propertyKey: K,
    value: BFChainLink.AsyncValue<T[K]> | T[K],
  ) {
    const iobCacher = this._iobCacher as BFChainLink.HolderReflect.IOB_CacherLocal<T & object>;
    helper.resolveCallback(cb, Reflect.set(iobCacher.value, propertyKey, value));
  }
  setHolder<K extends BFChainLink.AsyncUtil.PropertyKey<T>>(
    propertyKey: K,
    value: BFChainLink.AsyncValue<T[K]> | T[K],
  ) {
    return this.createSubHolder<boolean>([EmscriptenReflect.Set, propertyKey, value]);
  }

  private set_remote<K extends BFChainLink.AsyncUtil.PropertyKey<T>>(
    cb: CallbackAsyncValue<boolean>,
    propertyKey: K,
    value: BFChainLink.AsyncValue<T[K]> | T[K],
  ) {
    return this.setHolder(propertyKey, value).toValueSync(cb);
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

    if (iobCacher.type === IOB_CACHE_STATUS.THROW) {
      return this.throw_binded;
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
    const iobCacher = this._iobCacher as BFChainLink.HolderReflect.IOB_CacherLocal<T & object>;
    helper.resolveCallback(cb, Reflect.setPrototypeOf(iobCacher.value, proto));
  }

  setPrototypeOfHolder(proto: unknown) {
    return this.createSubHolder<boolean>([EmscriptenReflect.SetPrototypeOf, proto]);
  }
  private setPrototypeOf_remote(cb: CallbackAsyncValue<boolean>, proto: unknown) {
    return this.setPrototypeOfHolder(proto).toValueSync(cb);
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

    if (iobCacher.type === IOB_CACHE_STATUS.THROW) {
      return this.throw_binded;
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
    cb: CallbackAsyncValue<BFChainLink.AsyncUtil.Get<T, K>>,
    propertyKey: K,
  ) {
    const iobCacher = this._iobCacher as BFChainLink.HolderReflect.IOB_CacherHasValue<T>;
    helper.resolveCallback(cb, iobCacher.value[propertyKey as never]);
  }

  assetHolder<K extends PropertyKey>(propertyKey: K) {
    return this.createSubHolder<BFChainLink.AsyncUtil.Get<T, K>>([
      EmscriptenReflect.Asset,
      propertyKey,
    ]);
  }

  private asset_remote<K extends PropertyKey>(
    cb: CallbackAsyncValue<BFChainLink.AsyncUtil.Get<T, K>>,
    propertyKey: K,
  ) {
    this.assetHolder(propertyKey).toValueSync(cb);
  }

  get assetCallback(): HolderReflect<T>["asset_value"] {
    const { _iobCacher: iobCacher } = this;
    if (
      // 未知，未发送
      !iobCacher ||
      // 未知，未返回
      iobCacher.type === IOB_CACHE_STATUS.WAITING
    ) {
      return this.asset_remote;
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

    if (iobCacher.type === IOB_CACHE_STATUS.THROW) {
      return this.throw_binded;
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
  Operator_instanceOf<C extends BFChainUtil.Constructor<unknown>>(Ctor: BFChainLink.Holder<C>) {}
  Operator_instanceOfHolder<C extends BFChainUtil.Constructor<unknown>>(
    Ctor: BFChainLink.Holder<C>,
  ) {
    return this.createSubHolder<boolean>([EmscriptenReflect.Instanceof, Ctor]);
  }

  /**typeof 的操作符*/
  Operator_typeOf() {}
  Operator_typeOfHolder() {
    const typeName = typeof this;
    return this.createSubHolder<typeof typeName>([EmscriptenReflect.Typeof]);
  }
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
  @bindThis
  async *iterator() {
    const iterable = (await this.assetHolder(Symbol.iterator).apply(
      this.toAsyncValue(),
      [] as never,
    )) as BFChainLink.Holder<IterableIterator<unknown>>;

    do {
      const item = await iterable.next();
      if (await item.done) {
        break;
      }
      yield item.value as BFChainLink.AsyncValue<BFChainLink.AsyncUtil.IteratorType<T>>;
    } while (true);
  }
  /**支持自定义的Symbol.asyncIterator，本地可用for await来进行迭代 */
  @bindThis
  async *asyncIterator() {
    const iterable = (await this.assetHolder(Symbol.asyncIterator).apply(
      this.toAsyncValue(),
      [] as never,
    )) as BFChainLink.Holder<AsyncIterator<unknown>>;
    do {
      const item = await iterable.next();
      if (await item.done) {
        break;
      }
      yield item.value as BFChainLink.AsyncValue<BFChainLink.AsyncUtil.AsyncIteratorType<T>>;
    } while (true);
  }

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

  JSON_stringify() {
    return this.createSubHolder<string>([EmscriptenReflect.JsonStringify]);
  }
  JSON_parse() {
    return this.createSubHolder<string>([EmscriptenReflect.JsonParse]);
  }
  //#endregion
}
