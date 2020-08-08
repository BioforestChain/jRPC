declare namespace BFChainComlink {
  //#region Endpoint

  interface EndpointEventMap {
    message: MessageEvent;
  }

  type EndpointEventListenerOrEventListenerObject =
    | ((ev: MessageEvent) => unknown)
    | { handleEvent(evt: MessageEvent): unknown };

  interface EventSource {
    addEventListener<K extends keyof EndpointEventMap>(
      type: K,
      listener: EndpointEventListenerOrEventListenerObject,
      options?: {}
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: {}
    ): void;
    removeEventListener<K extends keyof EndpointEventMap>(
      type: K,
      listener: EndpointEventListenerOrEventListenerObject,
      options?: {}
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: {}
    ): void;
  }

  interface Endpoint extends EventSource {
    postMessage(message: any, transfer?: Transferable[]): void;
    start?: () => void;
  }

  interface PostMessageWithOrigin {
    postMessage(
      message: any,
      targetOrigin: string,
      transfer?: Transferable[]
    ): void;
  }
  //#endregion

  //#region Wire
  type WireId = number;

  // type WireValueType = import("./const").WireValueType;

  interface RawWireValue {
    id: WireId;
    type: import("./const").WireValueType.RAW;
    value: {};
  }

  interface RawListWireValue {
    id: WireId;
    type: import("./const").WireValueType.RAW_ARRAY;
    value: WireValue[];
  }

  type DeserializableWireType =
    | import("./const").WireValueType.HANDLER
    | import("./const").WireValueType.CLASS
    | import("./const").WireValueType.PROTO;
  interface DeserializableWireValue {
    id: WireId;
    type: DeserializableWireType;
    name: TransferKey;
    value: unknown;
  }

  type WireValue = RawWireValue | RawListWireValue | DeserializableWireValue;
  //#endregion

  //#region Message

  type MessageID = number;

  interface GetMessage {
    id: MessageID;
    type: import("./const").MessageType.GET;
    path: string[];
  }

  interface SetMessage {
    id: MessageID;
    type: import("./const").MessageType.SET;
    path: string[];
    value: WireValue;
  }

  interface ApplyMessage {
    id: MessageID;
    type: import("./const").MessageType.APPLY;
    path: string[];
    argumentList: WireValue[];
  }

  interface ConstructMessage {
    id: MessageID;
    type: import("./const").MessageType.CONSTRUCT;
    path: string[];
    argumentList: WireValue[];
  }

  interface EndpointMessage {
    id: MessageID;
    type: import("./const").MessageType.ENDPOINT;
  }

  interface ReleaseMessage {
    id: MessageID;
    type: import("./const").MessageType.RELEASE;
    path: string[];
  }

  type Message =
    | GetMessage
    | SetMessage
    | ApplyMessage
    | ConstructMessage
    | EndpointMessage
    | ReleaseMessage;
  //#endregion

  //#region Const
  type TransferKey = string;
  namespace TransferClass {
    const TRANSFER_SYMBOL: unique symbol;
    type TransferSymbol = typeof TRANSFER_SYMBOL;
  }
  namespace TransferProto {
    const TRANSFER_SYMBOL: unique symbol;
    type TransferSymbol = typeof TRANSFER_SYMBOL;
    type TransferMarked<K, V = unknown> = V & {
      [TRANSFER_SYMBOL]: K;
    };
  }

  /**
   * 通用的异常传输
   */
  type SerializedThrownValue =
    | { isError: true; value: Error }
    | { isError: false; value: unknown };

  const PROXY_MARKER: "Comlink.proxy";
  const THROW_MARKER: "Comlink.throw";
  type ProxyMarker = typeof PROXY_MARKER;
  type ThrowMarker = typeof THROW_MARKER;
  type ProxyMarked<V extends object = object> = TransferProto.TransferMarked<
    ProxyMarker,
    V
  >;
  type ThrowMarked<V = unknown> = TransferProto.TransferMarked<ThrowMarker, V>;

  const CREATE_ENDPOINT_SYMBOL: unique symbol;
  const RELEASE_PROXY_SYMBOl: unique symbol;
  const SAFE_TYPE_SYMBOL: unique symbol;

  type CreateEndpointSymbol = typeof CREATE_ENDPOINT_SYMBOL;
  type ReleaseProxySymbol = typeof RELEASE_PROXY_SYMBOl;
  type SafeTypeSymbol = typeof SAFE_TYPE_SYMBOL;

  /**
   * Additional special comlink methods available on each proxy returned by `Comlink.wrap()`.
   */
  interface ProxyMethods<T = unknown> {
    [CREATE_ENDPOINT_SYMBOL]: () => Promise<MessagePort>;
    [RELEASE_PROXY_SYMBOl]: () => void;
    [SAFE_TYPE_SYMBOL]: T;
  }
  //#endregion

  //#region Remote

  /**
   * Takes a type and wraps it in a Promise, if it not already is one.
   * This is to avoid `Promise<Promise<T>>`.
   *
   * This is the inverse of `Unpromisify<T>`.
   */
  type Promisify<T> = T extends PromiseLike<unknown> ? T : Promise<T>;
  /**
   * Takes a type that may be Promise and unwraps the Promise type.
   * If `P` is not a Promise, it returns `P`.
   *
   * This is the inverse of `Promisify<T>`.
   */
  type Unpromisify<P> = P extends PromiseLike<infer T> ? T : P;

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
    T extends Function | ProxyMarked ? Remote<T> : Promisify<T>;

  /**
   * Takes the raw type of a property as a remote thread would see it through a proxy (e.g. when passed in as a function
   * argument) and returns the type that the local thread has to supply.
   *
   * This is the inverse of `RemoteProperty<T>`.
   *
   * Note: This needs to be its own type alias, otherwise it will not distribute over unions. See
   * https://www.typescriptlang.org/docs/handbook/advanced-types.html#distributive-conditional-types
   */
  type LocalProperty<T> = T extends Function | ProxyMarked
    ? Local<T>
    : Unpromisify<T>;

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
          ) => Promisify<ProxyOrClone<Unpromisify<TReturn>>>
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
      ProxyMethods<T>;

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
  type Local<T> =
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

  //#endregion

  //#region Transfer
  /**
   * 依赖于原型链的转换
   */
  interface TransferProto<I = unknown, O = unknown, D = I> {
    // proto: symbol;
    serialize(obj: I): [O, Transferable[]];
    deserialize(obj: O): D;
  }
  /**
   * 依赖于构造函数的转换
   */
  interface TransferClass<C extends AnyClass = AnyClass, O = unknown, D = C>
    extends TransferProto<C, O, D> {
    ctor: C;
  }
  type AnyClass<P = any> = new (...args: any) => P;
  /**
   * 自定义判定转换
   */
  interface TransferHandler<I = unknown, O = unknown, D = I>
    extends TransferProto<I, O, D> {
    canHandle(value: unknown): value is I;
  }

  //#endregion
}
