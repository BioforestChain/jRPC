import { EmscriptenReflect } from "@bfchain/comlink-typings";

export const ESM_REFLECT_FUN_MAP = new Map([
  // [EmscriptenReflect.Multi, (target: object,operatorList:) => Reflect.getPrototypeOf(target)],
  [EmscriptenReflect.GetPrototypeOf, (target: object) => Reflect.getPrototypeOf(target)],
  [
    EmscriptenReflect.SetPrototypeOf,
    (target: object, [proto]: unknown[]) => Reflect.setPrototypeOf(target, proto),
  ],
  [EmscriptenReflect.IsExtensible, (target: object) => Reflect.isExtensible(target)],
  [EmscriptenReflect.PreventExtensions, (target: object) => Reflect.preventExtensions(target)],
  [
    EmscriptenReflect.GetOwnPropertyDescriptor,
    (target: object, [prop]: unknown[]) =>
      Reflect.getOwnPropertyDescriptor(target, prop as PropertyKey),
  ],
  [
    EmscriptenReflect.Has,
    (target: object, [prop]: unknown[]) => Reflect.has(target, prop as PropertyKey),
  ],
  [
    EmscriptenReflect.Get,
    (target: object, [prop]: unknown[]) => Reflect.get(target, prop as PropertyKey),
  ],
  [
    EmscriptenReflect.Set,
    (target: object, [prop, value]: unknown[]) => Reflect.set(target, prop as PropertyKey, value),
  ],
  [
    EmscriptenReflect.DeleteProperty,
    (target: object, [prop]: unknown[]) => Reflect.deleteProperty(target, prop as PropertyKey),
  ],
  [
    EmscriptenReflect.DefineProperty,
    (target: object, [prop, attr]: unknown[]) =>
      Reflect.defineProperty(target, prop as PropertyKey, attr as PropertyDescriptor),
  ],
  [EmscriptenReflect.OwnKeys, (target: object) => Reflect.ownKeys(target)],
  [
    EmscriptenReflect.Apply,
    (target: object, [ctx, ...args]: unknown[]) =>
      Reflect.apply(target as Function, ctx, args as ArrayLike<unknown>),
  ],
  [
    EmscriptenReflect.Construct,
    (target: object, [newTarget, ...args]: unknown[]) =>
      Reflect.construct(target as Function, args as ArrayLike<unknown>, newTarget),
  ],

  /// 运算符
  [EmscriptenReflect.Asset, (target: object, [prop]: unknown[]) => target[prop as never]],
  [EmscriptenReflect.Typeof, (target: unknown) => typeof target],
  [
    EmscriptenReflect.Instanceof,
    (target: object, [ctor]: unknown[]) => target instanceof (ctor as never),
  ],
]);

export const SyncForCallback = <T>(cb: BFChainComlink.Callback<T>, handler: () => T) => {
  try {
    cb({ isError: false, data: handler() });
  } catch (error) {
    cb({ isError: true, error });
  }
};
export function resolveCallback<T>(cb: BFChainComlink.Callback<T>, data: T) {
  cb({ isError: false, data });
}
export function rejectCallback<E>(cb: BFChainComlink.Callback<never, E>, error: E) {
  cb({ isError: true, error });
}

/**
 * 生成一个回调函数，通过指定的处理函数，最终传输给cb风格的出口
 * @param output
 * @param transformer
 */
export const SyncPiperFactory = <ARG extends unknown[], T>(
  output: BFChainComlink.Callback<T>,
  transformer: (...args: ARG) => T,
) => {
  return (...args: ARG) => {
    try {
      output({ isError: false, data: transformer(...args) });
    } catch (error) {
      output({ isError: true, error });
    }
  };
};
/**
 * @TODO 移除这些异步helper
 * 生成一个回调函数，通过指定的处理函数，最终传输给cb风格的出口
 * @param output
 * @param transformer
 */
export const AsyncPiperFactory = <ARG extends unknown[], T>(
  output: BFChainComlink.Callback<T>,
  transformer: (...args: ARG) => PromiseLike<T>,
) => {
  return async (...args: ARG) => {
    try {
      output({ isError: false, data: await transformer(...args) });
    } catch (error) {
      output({ isError: true, error });
    }
  };
};

export const OpenArg = <T>(arg: BFChainComlink.CallbackArg<T>) => {
  if (arg.isError) {
    throw arg.error;
  }
  return arg.data;
};
