import { EmscriptenReflect } from "@bfchain/comlink-typings";

type EsmReflectSyncFun = {
  type: "sync";
  fun: (target: any, ...args: any[]) => any;
};
type EsmReflectAsyncFun = {
  type: "async";
  fun: (target: any, ...args: any[]) => any;
};

export const ESM_REFLECT_FUN_MAP = new Map<
  EmscriptenReflect,
  EsmReflectSyncFun | EsmReflectAsyncFun
>([
  [
    EmscriptenReflect.GetPrototypeOf,
    _SyncToCallback((target: object) => Reflect.getPrototypeOf(target)),
  ],
  [
    EmscriptenReflect.SetPrototypeOf,
    _SyncToCallback((target: object, [proto]: unknown[]) => Reflect.setPrototypeOf(target, proto)),
  ],
  [
    EmscriptenReflect.IsExtensible,
    _SyncToCallback((target: object) => Reflect.isExtensible(target)),
  ],
  [
    EmscriptenReflect.PreventExtensions,
    _SyncToCallback((target: object) => Reflect.preventExtensions(target)),
  ],
  [
    EmscriptenReflect.GetOwnPropertyDescriptor,
    _SyncToCallback((target: object, [prop]: unknown[]) =>
      Reflect.getOwnPropertyDescriptor(target, prop as PropertyKey),
    ),
  ],
  [
    EmscriptenReflect.Has,
    _SyncToCallback((target: object, [prop]: unknown[]) =>
      Reflect.has(target, prop as PropertyKey),
    ),
  ],
  [
    EmscriptenReflect.Get,
    _SyncToCallback((target: object, [prop]: unknown[]) =>
      Reflect.get(target, prop as PropertyKey),
    ),
  ],
  [
    EmscriptenReflect.Set,
    _SyncToCallback((target: object, [prop, value]: unknown[]) =>
      Reflect.set(target, prop as PropertyKey, value),
    ),
  ],
  [
    EmscriptenReflect.DeleteProperty,
    _SyncToCallback((target: object, [prop]: unknown[]) =>
      Reflect.deleteProperty(target, prop as PropertyKey),
    ),
  ],
  [
    EmscriptenReflect.DefineProperty,
    _SyncToCallback((target: object, [prop, attr]: unknown[]) =>
      Reflect.defineProperty(target, prop as PropertyKey, attr as PropertyDescriptor),
    ),
  ],
  [EmscriptenReflect.OwnKeys, _SyncToCallback((target: object) => Reflect.ownKeys(target))],
  [
    EmscriptenReflect.Apply,
    _SyncToCallback((target: object, [ctx, ...args]: unknown[]) =>
      Reflect.apply(target as Function, ctx, args as ArrayLike<unknown>),
    ),
  ],
  [
    EmscriptenReflect.SyncApply,
    {
      type: "async",
      fun: (target: object, [ctx, ...args]: unknown[]) =>
        Reflect.apply(target as Function, ctx, args as ArrayLike<unknown>),
    },
  ],
  [
    EmscriptenReflect.AsyncApply,
    {
      type: "sync",
      fun: (target: object, [resolve, reject, ctx, ...args]: unknown[]) =>
        queueMicrotask(async () => {
          try {
            const res = await Reflect.apply(target as Function, ctx, args as ArrayLike<unknown>);
            (resolve as any)(res);
          } catch (err) {
            (reject as any)(err);
          }
        }),
    },
  ],
  [
    EmscriptenReflect.Construct,
    _SyncToCallback((target: object, [newTarget, ...args]: unknown[]) =>
      Reflect.construct(target as Function, args as ArrayLike<unknown>, newTarget),
    ),
  ],

  /// 运算符
  [
    EmscriptenReflect.Asset,
    _SyncToCallback((target: object, [prop]: unknown[]) => target[prop as never]),
  ],
  [EmscriptenReflect.Typeof, _SyncToCallback((target: unknown) => typeof target)],
  [
    EmscriptenReflect.Instanceof,
    _SyncToCallback((target: object, [ctor]: unknown[]) => target instanceof (ctor as never)),
  ],
  [EmscriptenReflect.JsonStringify, _SyncToCallback((target: unknown) => JSON.stringify(target))],
  [EmscriptenReflect.JsonParse, _SyncToCallback((target: unknown) => JSON.parse(target as string))],
]);

function _SyncToCallback<T, ARGS extends unknown[]>(handler: (target: any, ...args: ARGS) => T) {
  return {
    type: "sync",
    fun: handler,
  } as EsmReflectSyncFun;
}

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

declare const queueMicrotask: (cb: Function) => void;

// let _queueMicrotask: typeof queueMicrotask;
// if (typeof queueMicrotask === "function") {
//   /// globalThis和queueMicrotask是同个版本出现的
//   _queueMicrotask = queueMicrotask.bind(globalThis);
// } else {
//   const p = Promise.resolve();
//   _queueMicrotask = (cb) => {
//     p.then(cb as any).catch((err) => setTimeout(() => {}, 0));
//   };
// }
