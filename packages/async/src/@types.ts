declare namespace BFChainComlink {
  interface ComlinkAsync extends ComlinkCore {
    /**导入
     * 同语法：
     * import ? from port
     * import { key } from port
     */
    import<T>(key?: string): PromiseLike<AsyncUtil.Remote<T>>;
  }

  type Holder<T = unknown> = T extends object
    ? AsyncUtil.Remote<T>
    : BFChainUtil.PromiseMaybe<AsyncUtil.Remote<T>>;

  type AsyncValue<T> = T extends object ? Holder<T> : T;

  /**
   * @TODO 需要提供callback版本，不能只提供promise版本，会不精确
   */
  interface HolderReflect<T /* extends object */> {
    // readonly linkIn:
    //   | readonly []
    //   | readonly [import("@bfchain/comlink-typings").EmscriptenReflect, ...unknown[]];
    createSubHolder<R>(
      linkIn: [import("@bfchain/comlink-typings").EmscriptenReflect, ...unknown[]],
    ): HolderReflect<R>;
    toHolder(): Holder<T>;
    toValue(): BFChainUtil.PromiseMaybe<AsyncValue<T>>;
    toAsyncValue(): AsyncValue<T>;
    bindIOB(iob: ComlinkProtocol.IOB, isError?: boolean): void;
    getIOB(): ComlinkProtocol.IOB | undefined;
    isBindedIOB(): boolean;
    waitIOB(): BFChainUtil.PromiseMaybe<ComlinkProtocol.IOB>;

    // throw(): BFChainUtil.PromiseMaybe<unknown>;

    // source?: T;
    // toString(): BFChainUtil.PromiseMaybe<AsyncUtil.Primitive<T>>;
    apply(
      thisArgument: unknown,
      argumentsList: AsyncUtil.Parameters<T>,
    ): BFChainUtil.PromiseMaybe<AsyncValue<AsyncUtil.ReturnType<T>>>;
    construct(
      argumentsList: AsyncUtil.ConstructorParameters<T>,
      newTarget?: unknown,
    ): BFChainUtil.PromiseMaybe<AsyncValue<AsyncUtil.InstanceType<T>>>;
    defineProperty<K extends AsyncUtil.PropertyKey<T>>(
      propertyKey: K,
      attributes: AsyncUtil.PropertyDescriptor<T, K>,
    ): BFChainUtil.PromiseMaybe<boolean>;
    deleteProperty(propertyKey: AsyncUtil.PropertyKey<T>): BFChainUtil.PromiseMaybe<boolean>;
    get<K extends PropertyKey>(
      propertyKey: K,
    ): BFChainUtil.PromiseMaybe<AsyncValue<AsyncUtil.Get<T, K>>>;
    asset<K extends PropertyKey>(
      propertyKey: K,
    ): BFChainUtil.PromiseMaybe<AsyncValue<AsyncUtil.Get<T, K>>>;
    getOwnPropertyDescriptor<K extends AsyncUtil.PropertyKey<T>>(
      propertyKey: K,
    ): BFChainUtil.PromiseMaybe<AsyncValue<AsyncUtil.PropertyDescriptor<T, K> | undefined>>;
    getPrototypeOf<P = unknown>(): BFChainUtil.PromiseMaybe<AsyncValue<P>>;
    has(propertyKey: AsyncUtil.PropertyKey<T>): BFChainUtil.PromiseMaybe<boolean>;
    isExtensible(): BFChainUtil.PromiseMaybe<boolean>;
    ownKeys(): BFChainUtil.PromiseMaybe<AsyncValue<AsyncUtil.PropertyKey<T>[]>>;
    preventExtensions(): BFChainUtil.PromiseMaybe<boolean>;
    set<K extends AsyncUtil.PropertyKey<T>>(
      propertyKey: K,
      value: AsyncValue<T[K]> | T[K],
    ): BFChainUtil.PromiseMaybe<boolean>;
    setPrototypeOf(proto: unknown): BFChainUtil.PromiseMaybe<boolean>;
  }

  namespace AsyncUtil {
    type ObjectPaths<T, Ks> = Ks extends [infer K1, ...infer K2]
      ? K2 extends []
        ? K1 extends keyof T
          ? T[K1]
          : unknown
        : K1 extends keyof T
        ? ObjectPaths<T[K1], K2>
        : unknown
      : T;
    // type a = {
    //   b: {
    //     c: 1;
    //   };
    // };
    // type c = ObjectPaths<a, ["b", "c"]>;

    // type Key<T> = T extends
    // type Keys<Ks extends unknown[]> = Ks extends [infer K1,...infer K2]?

    type IteratorType<
      T
    > = /* T extends Remote<{
      [Symbol.iterator](): IterableIterator<infer I>;
    }>
      ? I
      : */ T extends {
      [Symbol.iterator](): IterableIterator<infer I>;
    }
      ? I
      : never;
    type AsyncIteratorType<T> = T extends Holder<{
      [Symbol.asyncIterator](): AsyncIterator<infer I>;
    }>
      ? I
      : T extends {
          [Symbol.asyncIterator](): AsyncIterator<infer I>;
        }
      ? I
      : never;

    type Primitive<T> = T extends object ? never : T;
    type NoPrimitive<T> = T extends object ? T : never;
    type Parameters<T> = T extends (...args: infer P) => any ? P : never;
    type ReturnType<T> = T extends (...args: any) => infer R ? R : any;
    type ConstructorParameters<T> = T extends new (...args: infer P) => any ? P : never;
    type InstanceType<T> = T extends new (...args: any) => infer R ? R : any;
    type PropertyKey<T> = keyof T;
    type PropertyDescriptorStract<T, K extends PropertyKey<T>> = {
      configurable?: boolean;
      enumerable?: boolean;
      value?: AsyncValue<T[K]>;
      writable?: boolean;
      get?(): AsyncValue<T[K]>;
      set?(v: AsyncValue<T[K]> | T[K]): void;
    };
    type Get<T, K> = K extends PropertyKey<T> ? T[K] : unknown;
    type PropertyDescriptor<T, K> = K extends PropertyKey<T>
      ? PropertyDescriptorStract<T, K>
      : never;

    /**
     * Takes the raw type of a remote object in the other thread and returns the type as it is visible to the local thread
     * when proxied with `Comlink.proxy()`.
     *
     * This does not handle call signatures, which is handled by the more general `Remote<T>` type.
     *
     * @template T The raw type of a remote object as seen in the other thread.
     */
    type RemoteObject<T> = { [P in keyof T]: Holder<T[P]> };

    type RemoteArgument<
      T
    > = /* T extends (...args: infer TArguments) => infer TReturn
      ? /// 回调函数的参数类型可能会发生改变，可能是远端的，也可能是本地的
        (...args: { [I in keyof TArguments]: Holder<TArguments[I]> | TArguments[I] }) => TReturn
      :  */ T;

    type RemoteArguments<TArguments extends readonly unknown[]> = {
      [I in keyof TArguments]: RemoteArgument<TArguments[I]>;
    };
    type _ArrayToUnknown<TArguments extends unknown[]> = TArguments extends []
      ? []
      : TArguments extends [infer A, ...infer ARGS]
      ? [_ItemToUnknown<A>, ..._ArrayToUnknown<ARGS>]
      : never;
    type _ItemToUnknown<TArguments> = TArguments extends (...args: unknown[]) => unknown
      ? (...args: unknown[]) => unknown
      : unknown;

    type _MixUnknownToCustom<SA extends unknown[], CA extends unknown[]> = SA extends [
      infer SA1,
      ...infer SA_REST
    ]
      ? CA extends [infer CA1, ...infer CA_REST]
        ? [SA1 extends unknown ? CA1 : SA1, _MixUnknownToCustom<SA_REST, CA_REST>]
        : SA
      : SA;

    type RemoteReturn<TReturn> = Holder<Util.Unpromisify<TReturn>>;
    /**
     * Takes the raw type of a remote object, function or class in the other thread and returns the type as it is visible to
     * the local thread from the proxy return value of `Comlink.wrap()` or `Comlink.proxy()`.
     */
    type Remote<T> =
      // Handle properties
      RemoteObject<T> &
        // Handle call signature (if present)
        (T extends (...args: infer TArguments) => infer TReturn
          ? <R = TReturn, ARGS extends unknown[] = unknown[]>(
              // ...args: _MixUnknownToCustom<TArguments, ARGS>
              ...args: _ArrayToUnknown<TArguments> extends TArguments
                ? RemoteArguments<ARGS>
                : RemoteArguments<TArguments>
            ) => TReturn extends unknown ? RemoteReturn<R> : RemoteReturn<TReturn>
          : unknown) &
        // Handle construct signature (if present)
        // The return of construct signatures is always proxied (whether marked or not)
        (T extends { new (...args: infer TArguments): infer TInstance }
          ? {
              new (
                ...args: {
                  [I in keyof TArguments]: RemoteArgument<TArguments[I]>;
                }
              ): Holder<TInstance>;
            }
          : unknown);
  }

  namespace HolderReflect {
    type IOB_Cacher<T> = IOB_CacherWaiting | IOB_CacherThrow<T> | IOB_CacherBinded<T>;

    interface IOB_CacherWaiting {
      type: import("./const").IOB_CACHE_STATUS.WAITING;
      waitter: BFChainComlink.Callback<void>[]; // PromiseOut<void>;
    }

    interface IOB_CacherThrow<T> {
      type: import("./const").IOB_CACHE_STATUS.THROW;
      cacher: IOB_CacherBinded<T>;
    }

    interface IOB_CacherRemote<
      IOB extends EmscriptionLinkRefExtends.RefItem = EmscriptionLinkRefExtends.RefItem
    > {
      type: import("./const").IOB_CACHE_STATUS.REMOTE_REF;
      port: ComlinkProtocol.BinaryPort;
      iob: IOB;
    }
    interface IOB_CacherRemoteSymbol {
      type: import("./const").IOB_CACHE_STATUS.REMOTE_SYMBOL;
      port: ComlinkProtocol.BinaryPort;
      value: symbol;
      iob: EmscriptionLinkRefExtends.RemoteSymbolItem;
    }
    interface IOB_CacherLocal<T> {
      type: import("./const").IOB_CACHE_STATUS.LOCAL;
      value: T;
      iob: EmscriptionLinkRefExtends.InOutObj.Local;
    }
    type IOB_CacherHasValue<T> = IOB_CacherLocal<T> | IOB_CacherRemoteSymbol;
    type IOB_CacherBinded<T> = IOB_CacherHasValue<T> | IOB_CacherRemote;
  }
}
