import { EmscriptenReflect } from "@bfchain/link-typings";

type EsmReflectHanlder = {
  isAsync: boolean;
  paramListDeserialization?: (resList: readonly any[]) => any[];
  resultSerialization?: (res?: any) => readonly any[];
  fun: (target: any, ...args: any[]) => any;
};

export function propertyDescriptorSerialization(propDes?: PropertyDescriptor) {
  if (propDes === undefined) {
    return [];
  }
  return [
    propDes.configurable,
    propDes.enumerable,
    propDes.get,
    propDes.set,
    propDes.value,
    propDes.writable,
  ] as const;
}

type SerializatedPropertyDescriptor = ReturnType<typeof propertyDescriptorSerialization>;
export function propertyDescriptorDeserialization(propSed: SerializatedPropertyDescriptor) {
  if (propSed.length === 0) {
    return;
  }
  const propDes: PropertyDescriptor = {};
  /// 注意这里要避免产生隐式转换，因为肯能是ComlinkAsync的Holder对象
  propSed[0] !== undefined && (propDes.configurable = propSed[0]);
  propSed[1] !== undefined && (propDes.enumerable = propSed[1]);
  propSed[2] !== undefined && (propDes.get = propSed[2]);
  propSed[3] !== undefined && (propDes.set = propSed[3]);
  propSed[4] !== undefined && (propDes.value = propSed[4]);
  propSed[5] !== undefined && (propDes.writable = propSed[5]);
  return propDes;
}

export const ESM_REFLECT_FUN_MAP = new Map<EmscriptenReflect, EsmReflectHanlder>([
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
    _SyncToCallback(
      (target: object, [prop]: unknown[]) =>
        Reflect.getOwnPropertyDescriptor(target, prop as PropertyKey),
      undefined,
      propertyDescriptorSerialization,
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
    _SyncToCallback(
      (target: object, [prop, attr]: unknown[]) =>
        Reflect.defineProperty(target, prop as PropertyKey, attr as never),
      ([prop, ...propSed]) => [prop, propertyDescriptorDeserialization(propSed as never)],
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
    _AsyncToCallback((target: object, [ctx, ...args]: unknown[]) =>
      Reflect.apply(target as Function, ctx, args as ArrayLike<unknown>),
    ),
  ],
  [
    EmscriptenReflect.AsyncApply,
    _SyncToCallback((target: object, [resolve, reject, ctx, ...args]: unknown[]) =>
      queueMicrotask(async () => {
        try {
          const res = await Reflect.apply(target as Function, ctx, args as ArrayLike<unknown>);
          (resolve as any)(res);
        } catch (err) {
          (reject as any)(err);
        }
      }),
    ),
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

function _SyncToCallback<T, ARGS extends unknown[]>(
  handler: (target: any, ...args: ARGS) => T,
  paramListDeserialization?: EsmReflectHanlder["paramListDeserialization"],
  resultSerialization?: EsmReflectHanlder["resultSerialization"],
) {
  return {
    isAsync: false,
    paramListDeserialization,
    resultSerialization,
    fun: handler,
  } as EsmReflectHanlder;
}
function _AsyncToCallback<T, ARGS extends unknown[]>(
  handler: (target: any, ...args: ARGS) => PromiseLike<T>,
  paramListDeserialization?: EsmReflectHanlder["paramListDeserialization"],
  resultSerialization?: EsmReflectHanlder["resultSerialization"],
) {
  return {
    isAsync: true,
    paramListDeserialization,
    resultSerialization,
    fun: handler,
  } as EsmReflectHanlder;
}

export const SyncForCallback = <T>(cb: BFChainLink.Callback<T>, handler: () => T) => {
  try {
    cb({ isError: false, data: handler() });
  } catch (error) {
    cb({ isError: true, error });
  }
};
export function resolveCallback<T>(cb: BFChainLink.Callback<T>, data: T) {
  cb({ isError: false, data });
}
export function rejectCallback<E>(cb: BFChainLink.Callback<never, E>, error: E) {
  cb({ isError: true, error });
}

/**
 * 生成一个回调函数，通过指定的处理函数，最终传输给cb风格的出口
 * @param output
 * @param transformer
 */
export const SyncPiperFactory = <ARG extends unknown[], T>(
  output: BFChainLink.Callback<T>,
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
  output: BFChainLink.Callback<T>,
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

export const OpenArg = <T>(arg: BFChainLink.CallbackArg<T, any>) => {
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
