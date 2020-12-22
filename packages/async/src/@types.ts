declare namespace BFChainComlink {
  interface ComlinkAsync {
    import<T>(key?: string): PromiseLike<AsyncUtil.Remote<T>>;
    // import<T>(key?: string): PromiseLike<AsyncValue<T>>;
    // wrap<T>(val: HolderReflect<T>): AsyncUtil.Remote<T>;
  }

  type Holder<T = unknown> = PromiseLike<T> & AsyncUtil.Remote<T>;

  type AsyncValue<T> = T extends object ? Holder<T> : T;

  /**
   * @TODO 需要提供callback版本，不能只提供promise版本，会不精确
   */
  interface HolderReflect<T /* extends object */> {
    readonly linkIn:
      | readonly []
      | readonly [import("@bfchain/comlink-typings").EmscriptenReflect, ...unknown[]];
    createSubHolder<R>(
      linkIn: [import("@bfchain/comlink-typings").EmscriptenReflect, ...unknown[]],
    ): HolderReflect<R>;
    toHolder(): Holder<T>;
    toValue(): BFChainUtil.PromiseMaybe<AsyncValue<T>>;
    bindIOB(iob: ComlinkProtocol.IOB): void;
    getIOB(): ComlinkProtocol.IOB | undefined;
    waitIOB(): BFChainUtil.PromiseMaybe<ComlinkProtocol.IOB>;

    throw(): BFChainUtil.PromiseMaybe<unknown>;

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

    const proxyMarker: unique symbol;
    type proxyMarkerSymbol = typeof proxyMarker;
    /**
     * Interface of values that were marked to be proxied with `comlink.proxy()`.
     * Can also be implemented by classes.
     */
    interface ProxyMarked {
      [proxyMarker]: true;
    }

    /**
     * Takes a type and wraps it in a Promise, if it not already is one.
     * This is to avoid `Promise<Promise<T>>`.
     *
     * This is the inverse of `Unpromisify<T>`.
     */
    type Promisify<T> = T extends Promise<unknown> ? T : Promise<T>;
    /**
     * Takes a type that may be Promise and unwraps the Promise type.
     * If `P` is not a Promise, it returns `P`.
     *
     * This is the inverse of `Promisify<T>`.
     */
    type Unpromisify<P> = P extends Promise<infer T> ? T : P;

    /**
     * Takes the raw type of a remote property and returns the type that is visible to the local thread on the proxy.
     *
     * Note: This needs to be its own type alias, otherwise it will not distribute over unions.
     * See https://www.typescriptlang.org/docs/handbook/advanced-types.html#distributive-conditional-types
     */
    type RemoteProperty<T> =
      // If the value is a method, comlink will proxy it automatically.
      // Objects are only proxied if they are marked to be proxied.
      // Otherwise, the property is converted to a Promise that resolves the cloned value.
      T extends Function | ProxyMarked ? Remote<T> : Promisify<Remote<T>>;

    /**
     * Takes the raw type of a property as a remote thread would see it through a proxy (e.g. when passed in as a function
     * argument) and returns the type that the local thread has to supply.
     *
     * This is the inverse of `RemoteProperty<T>`.
     *
     * Note: This needs to be its own type alias, otherwise it will not distribute over unions. See
     * https://www.typescriptlang.org/docs/handbook/advanced-types.html#distributive-conditional-types
     */
    type LocalProperty<T> = T extends Function | ProxyMarked ? Local<T> : Unpromisify<Local<T>>;

    /**
     * Proxies `T` if it is a `ProxyMarked`, clones it otherwise (as handled by structured cloning and transfer handlers).
     */
    type ProxyOrClone<T> = T extends ProxyMarked ? Remote<T> : T;
    /**
     * Inverse of `ProxyOrClone<T>`.
     */
    type UnproxyOrClone<T> = T extends RemoteObject<ProxyMarked> ? Local<T> : T;

    /**
     * Takes the raw type of a remote object in the other thread and returns the type as it is visible to the local thread
     * when proxied with `Comlink.proxy()`.
     *
     * This does not handle call signatures, which is handled by the more general `Remote<T>` type.
     *
     * @template T The raw type of a remote object as seen in the other thread.
     */
    type RemoteObject<T> = { [P in keyof T]: RemoteProperty<T[P]> };
    /**
     * Takes the type of an object as a remote thread would see it through a proxy (e.g. when passed in as a function
     * argument) and returns the type that the local thread has to supply.
     *
     * This does not handle call signatures, which is handled by the more general `Local<T>` type.
     *
     * This is the inverse of `RemoteObject<T>`.
     *
     * @template T The type of a proxied object.
     */
    type LocalObject<T> = { [P in keyof T]: LocalProperty<T[P]> };

    /**
     * Additional special comlink methods available on each proxy returned by `Comlink.wrap()`.
     */
    interface ProxyMethods {
      //   [createEndpoint]: () => Promise<MessagePort>;
      //   [releaseProxy]: () => void;
    }

    /**
     * Takes the raw type of a remote object, function or class in the other thread and returns the type as it is visible to
     * the local thread from the proxy return value of `Comlink.wrap()` or `Comlink.proxy()`.
     */
    type Remote<T> =
      // Handle properties
      RemoteObject<T> &
        // Handle call signature (if present)
        (T extends (...args: infer TArguments) => infer TReturn
          ? (
              ...args: { [I in keyof TArguments]: UnproxyOrClone<TArguments[I]> }
            ) => Promisify<Remote<ProxyOrClone<Unpromisify<TReturn>>>>
          : unknown) &
        // Handle construct signature (if present)
        // The return of construct signatures is always proxied (whether marked or not)
        (T extends { new (...args: infer TArguments): infer TInstance }
          ? {
              new (
                ...args: {
                  [I in keyof TArguments]: UnproxyOrClone<TArguments[I]>;
                }
              ): Promisify<Remote<TInstance>>;
            }
          : unknown) &
        // Include additional special comlink methods available on the proxy.
        ProxyMethods;

    /**
     * Expresses that a type can be either a sync or async.
     */
    type MaybePromise<T> = Promise<T> | T;

    /**
     * Takes the raw type of a remote object, function or class as a remote thread would see it through a proxy (e.g. when
     * passed in as a function argument) and returns the type the local thread has to supply.
     *
     * This is the inverse of `Remote<T>`. It takes a `Remote<T>` and returns its original input `T`.
     */
    export type Local<T> =
      // Omit the special proxy methods (they don't need to be supplied, comlink adds them)
      Omit<LocalObject<T>, keyof ProxyMethods> &
        // Handle call signatures (if present)
        (T extends (...args: infer TArguments) => infer TReturn
          ? (
              ...args: { [I in keyof TArguments]: ProxyOrClone<TArguments[I]> }
            ) => // The raw function could either be sync or async, but is always proxied automatically
            MaybePromise<UnproxyOrClone<Unpromisify<TReturn>>>
          : unknown) &
        // Handle construct signature (if present)
        // The return of construct signatures is always proxied (whether marked or not)
        (T extends { new (...args: infer TArguments): infer TInstance }
          ? {
              new (
                ...args: {
                  [I in keyof TArguments]: ProxyOrClone<TArguments[I]>;
                }
              ): // The raw constructor could either be sync or async, but is always proxied automatically
              MaybePromise<Local<Unpromisify<TInstance>>>;
            }
          : unknown);
  }
}
