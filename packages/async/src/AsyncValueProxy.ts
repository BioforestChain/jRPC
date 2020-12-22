import type {} from "@bfchain/util-typings";
import { isObj } from "@bfchain/comlink-typings";

import { PromiseOut, safePromiseThen } from "@bfchain/util-extends-promise";
import { HolderReflect } from "./HolderReflect";
import {
  EXPORT_FUN_DESCRIPTOR_SYMBOL,
  IOB_Extends_Type,
  IOB_Type,
} from "@bfchain/comlink-protocol";

// const isHolderReflect = <T = any>(obj: unknown): obj is BFChainComlink.HolderReflect<T> => {
//   return forceGetInstaceOf(obj, HolderReflect);
// };
// let _force_get_instance_of = false;
// const forceGetInstaceOf = <T extends object>(
//   obj: unknown,
//   ctor: T,
// ): obj is BFChainComlink.AsyncUtil.InstanceType<T> => {
//   _force_get_instance_of = true;
//   const res = obj instanceof (ctor as any);
//   _force_get_instance_of = false;
//   return res;
// };

// const ObjPropMapWM = new WeakMap<object, Map<PropertyKey, unknown>>();
// const getPropWM = (obj: object) => {
//   let propMap = ObjPropMapWM.get(obj);
//   if (!propMap) {
//     propMap = new Map();
//     ObjPropMapWM.set(obj, propMap);
//   }
//   return propMap;
// };
// const doGet = <T, K extends keyof T>(reflectValue: BFChainComlink.AsyncValue<T>, prop: K) => {
//   type R = BFChainComlink.AsyncValue<T[K]>;
//   let val: R | PromiseLike<R>;
//   return new Promise<R>((resolve, reject) => {
//     openAsSource(
//       prop,
//       async (prop) => {
//         if (isHolderReflect<T>(reflectValue)) {
//           val = reflectValue.get(prop);
//         } else {
//           /// Reflect 只适用object，这里有可能是 primitive
//           // val = Reflect.get(reflectValue, prop);
//           val = (reflectValue as any)[prop];
//         }
//         resolve(val);
//       },
//       reject,
//     );
//   });
// };
// const doSet = <T, K extends keyof T>(
//   reflectValue: BFChainComlink.AsyncValue<T>,
//   prop: K,
//   val: T[K],
// ) => {
//   return new Promise<unknown>((resolve, reject) => {
//     openAsSourceList(
//       [prop, val] as const,
//       ([prop, val]) => {
//         try {
//           if (isHolderReflect(reflectValue)) {
//             resolve(reflectValue.set(prop, val));
//           } else {
//             /// Reflect 只适用object，这里有可能是 primitive
//             resolve(((reflectValue as any)[prop] = val));
//           }
//         } catch (err) {
//           reject(err);
//         }
//       },
//       reject,
//     );
//   });
// };
// const doDeleteProperty = <T, K extends keyof T>(
//   reflectValue: BFChainComlink.AsyncValue<T>,
//   prop: K,
// ) => {
//   return new Promise<unknown>((resolve, reject) => {
//     openAsSource(
//       prop,
//       (prop) => {
//         try {
//           if (isHolderReflect(reflectValue)) {
//             resolve(reflectValue.deleteProperty(prop));
//           } else {
//             /// Reflect 只适用object，这里有可能是 primitive
//             resolve(delete (reflectValue as any)[prop]);
//           }
//         } catch (err) {
//           reject(err);
//         }
//       },
//       reject,
//     );
//   });
// };
// const doApply = <T>(
//   reflectValue: BFChainComlink.AsyncValue<T>,
//   thisArg: unknown,
//   argArray: BFChainComlink.AsyncUtil.Parameters<T>,
// ) => {
//   type R = BFChainComlink.AsyncValue<BFChainComlink.AsyncUtil.ReturnType<T>>;
//   let res: R | PromiseLike<R>;
//   return new Promise<R>((resolve, reject) => {
//     openAsSourceList(
//       [thisArg, ...argArray] as const,
//       ([thisArg, ...argArray]) => {
//         if (isHolderReflect<T>(reflectValue)) {
//           res = reflectValue.apply(thisArg, argArray);
//         } else {
//           res = Reflect.apply(reflectValue as any, thisArg, argArray);
//         }
//         resolve(res);
//       },
//       reject,
//     );
//   });
// };

// const doConstruct = async <T>(
//   reflectValue: BFChainComlink.AsyncValue<T>,
//   argArray: BFChainComlink.AsyncUtil.ConstructorParameters<T>,
//   newTarget: unknown,
// ) => {
//   type R = BFChainComlink.AsyncValue<BFChainComlink.AsyncUtil.InstanceType<T>>;
//   let res: R | PromiseLike<R>;
//   return new Promise<R>((resolve, reject) => {
//     openAsSourceList(
//       [newTarget, ...argArray] as const,
//       ([newTarget, ...argArray]) => {
//         if (isHolderReflect<T>(reflectValue)) {
//           res = reflectValue.construct(argArray, newTarget);
//         } else {
//           res = Reflect.construct(reflectValue as any, argArray, newTarget);
//         }
//         resolve(res);
//       },
//       reject,
//     );
//   });
// };

// type MaybeHolderReflectPromiseOut<T = object> =
//   | BFChainComlink.HolderReflect<T>
//   | PromiseOut<BFChainComlink.HolderReflect<T>>;
// /**缓存所有proxy与它的目标 */
// const PROXY_TARGET_WM = new WeakMap<object, MaybeHolderReflectPromiseOut>();
// const TARGET_PROXY_WM = new WeakMap<MaybeHolderReflectPromiseOut, object>();
// /**缓存所有内部生成的PromiseOut */
// const PROMISEOUT_WS = new WeakSet<PromiseOut<any>>();
// /**解开代理对象，获取原始值
//  * 不能用async/await，避免解开promise
//  */
// const openAsSource = <V>(
//   maybeSource: V,
//   onSuccess: (v: V) => unknown,
//   onError: (reason: unknown) => unknown,
// ) => {
//   /// 解开内部proxy
//   const asyncValue = (PROXY_TARGET_WM.has(maybeSource as any)
//     ? PROXY_TARGET_WM.get(maybeSource as any)
//     : maybeSource) as typeof maybeSource;

//   /// 解开内部promiseout
//   const asyncReflectValue = openPromiseOut<V>(asyncValue);

//   /// 解开asyncReflectValue
//   if (isHolderReflect<V>(asyncReflectValue)) {
//     const comlinkProxy = (asyncReflectValue as BFChainComlink.HolderReflect<V>).source;
//     if (!comlinkProxy) {
//       onError(new TypeError());
//       return;
//     }
//     onSuccess(comlinkProxy);
//   } else {
//     onSuccess(asyncReflectValue as V);
//   }
// };
// const openAsSourceList = <
//   ARGS extends /* 这里声明readonly，目的是用作支持类型推导 */ readonly unknown[]
// >(
//   args: ARGS,
//   onSuccess: (vs: ARGS) => unknown,
//   onError: (reasons: unknown[]) => unknown,
// ) => {
//   const successList = ([] as unknown) as ARGS;
//   const errorList = [] as unknown[];
//   let finishCount = 0;
//   const tryFinish = () => {
//     finishCount++;
//     if (finishCount === args.length) {
//       if (errorList.length > 0) {
//         onError(errorList);
//       } else {
//         onSuccess(successList);
//       }
//     }
//   };
//   for (let i = 0; i < args.length; i++) {
//     const arg = args[i];
//     openAsSource(
//       arg,
//       (res) => {
//         (successList as any)[i] = res;
//         tryFinish();
//       },
//       (err) => {
//         errorList[i] = err;
//         tryFinish();
//       },
//     );
//   }
// };
// const openPromiseOut = <V>(maybePo: unknown) => {
//   if (PROMISEOUT_WS.has(maybePo as any)) {
//     const po = maybePo as PromiseOut<V>;
//     if (po.is_resolved) {
//       return po.value as V;
//     } else if (po.is_rejected) {
//       throw po.reason;
//     }
//     return po.promise;
//   }
//   return maybePo as V;
// };
// const openAsAsyncValue = <V>(
//   maybePo: PromiseOut<BFChainComlink.AsyncValue<V>> | BFChainComlink.AsyncValue<V>,
//   onSuccess: (v: BFChainComlink.AsyncValue<V>) => unknown,
//   onError?: (reason: unknown) => unknown,
// ) => {
//   const promiseMaybe = openPromiseOut<BFChainComlink.AsyncValue<V>>(maybePo);
//   if (forceGetInstaceOf(promiseMaybe, Promise)) {
//     safePromiseThen(promiseMaybe, onSuccess, onError);
//   } else {
//     onSuccess(promiseMaybe);
//   }
// };

const noSupportHolderToPrimitive = (hint: string) =>
  new TypeError(
    `holder could not transfrom to ${hint} primitive, use await HolderRelect.to${hint.replace(
      "^[a-z]",
      (_) => _.toUpperCase(),
    )} to alertnative.`,
  );

// const THEN_DISABLED_WS = new WeakSet<object>();

export function createHolderProxyHanlder<T extends object>(
  holderReflect: BFChainComlink.HolderReflect<T>, // BFChainComlink.AsyncValue<T> | PromiseOut<BFChainComlink.AsyncValue<T>>,
  // source: T,
  // from: { target?: unknown; paths: PropertyKey[] },
) {
  // if (!isObj(holder)) {
  //   throw new TypeError();
  // }
  // if (holder instanceof PromiseOut) {
  //   holder.onSuccess((v) => {
  //     holder = v;
  //     asyncProxyCacher.clear();
  //   });
  // }
  // const asyncProxyCacher = new (class AsyncValueProxyCacher {
  //   get = this._sourceGet;
  //   clear() {
  //     this.get = this._sourceGet;
  //   }
  //   private _sourceGet() {
  //     return this._create();
  //   }
  //   private _create() {
  //     const asyncProxy = createAsyncValueProxy(holder, source, from);
  //     this.get = () => asyncProxy;
  //     return asyncProxy;
  //   }
  // })();

  // const propMap = getPropWM(source);

  const proxyHanlder: BFChainComlink.EmscriptionProxyHanlder<T> = {
    getPrototypeOf: () => {
      // if (!_force_get_instance_of) {
      //   console.warn("no support AsyncReflect.getPrototypeOf");
      // }
      return null;
    },
    setPrototypeOf: () => {
      console.warn("no support AsyncReflect.setPrototypeOf");
      return false;
    },
    isExtensible: () => {
      throw new Error("no support AsyncReflect.isExtensible");
    },
    preventExtensions: () => {
      throw new Error("no support AsyncReflect.preventExtensions");
    },
    getOwnPropertyDescriptor: () => {
      throw new Error("no support AsyncReflect.getOwnPropertyDescriptor");
    },
    defineProperty: () => {
      throw new Error("no support AsyncReflect.defineProperty");
    },
    ownKeys: () => {
      throw new Error("no support AsyncReflect.ownKeys");
    },
    has: () => {
      throw new Error("no support AsyncReflect.has");
    },
    /**导入子模块 */
    get: <K extends keyof T>(_target: object, prop: K, r?: unknown) => {
      // 禁止支持 Symbol.toPrimitive
      if (prop === Symbol.toPrimitive) {
        // throw new TypeError("holder could not get Symbol.toPrimitive")
        return noSupportHolderToPrimitive;
      }
      if (prop === EXPORT_FUN_DESCRIPTOR_SYMBOL) {
        return;
      }

      return holderReflect.asset(prop);

      // const propHolder = holderReflect.createSubHolder([]);

      // /**
      //  * @TODO 不能有缓存，除了then函数
      //  */
      // let propVal = propMap.get(prop);

      // /// 对then属性做特殊的处理
      // if (prop === "then") {
      //   // then disabled 是一次性的
      //   if (THEN_DISABLED_WS.has(holderReflect)) {
      //     THEN_DISABLED_WS.delete(holderReflect);
      //     return;
      //   }
      //   // 如果是then().then，禁用掉
      //   if (
      //     from.paths[from.paths.length - 2] === "then" &&
      //     from.paths[from.paths.length - 1] === "<apply>(~2parmas)"
      //   ) {
      //     return;
      //   }
      //   /// 如果前一个任务还没完成，那么自己的asyncValue就是promise模式
      //   if (propVal === undefined && holderReflect instanceof PromiseOut) {
      //     /// 那么这里创建一个 委托函数 进行promise任务等待，等待真正的asyncValue被上一个任务创建完成
      //     const po = holderReflect;
      //     propVal = (resolve: Function, reject: any) => {
      //       po.onSuccess((asyncValue) => {
      //         /// 清除已经缓存的 委托函数
      //         propMap.delete(prop);
      //         /// 返回原来的对象, resolve行为会再次触发then，如果可以，那么它会走下面那个非promiseOut的处理逻辑，如果asyncValue是primitive，那么就直接返回了
      //         return resolve(asyncProxyCacher.get());
      //       });
      //       po.onError(reject);
      //     };
      //   }
      // }
      // /// 获取或者创建缓存
      // if (propVal === undefined) {
      //   const promiseOut = new PromiseOut<BFChainComlink.AsyncValue<T[K]>>();
      //   PROMISEOUT_WS.add(promiseOut);
      //   openAsAsyncValue(
      //     holderReflect,
      //     (asyncValue) => {
      //       safePromiseThen(doGet(asyncValue, prop), promiseOut.resolve, promiseOut.reject);
      //     },
      //     promiseOut.reject,
      //   );
      //   propVal = createAsyncValueProxy<T[K]>(promiseOut, undefined, {
      //     get target() {
      //       return asyncProxyCacher.get();
      //     },
      //     paths: from.paths.concat(prop),
      //   });
      // }
      // propMap.set(prop, propVal);
      // return propVal;
    },
    /**发送 set 操作 */
    set: (_target, prop: keyof T, value: any, receiver: any) => {
      const res = holderReflect.set(prop, value);
      if (typeof res === "boolean") {
        return res;
      }
      // openAsAsyncValue(holderReflect, (asyncValue) => doSet(asyncValue, prop, value));
      return true;
    },
    deleteProperty: (target: T, prop: keyof T) => {
      const res = holderReflect.deleteProperty(prop);
      if (typeof res === "boolean") {
        return res;
      }
      // openAsAsyncValue(holderReflect, (asyncValue) => doDeleteProperty(asyncValue, prop));
      return true;
    },
    apply: (_target, thisArg, argArray) => {
      return holderReflect.apply(thisArg, argArray);
      // const retPo = new PromiseOut<
      //   BFChainComlink.AsyncValue<BFChainComlink.AsyncUtil.ReturnType<T>>
      // >();
      // openAsAsyncValue(
      //   holderReflect,
      //   (asyncValue) => {
      //     /// 对promise模式做特殊的包容性
      //     if (asyncValue === undefined && from.paths[from.paths.length - 1] === "then") {
      //       const thenFun = argArray[0];
      //       // 返回原来的对象
      //       if (typeof thenFun === "function") {
      //         const fromTarget = from.target;
      //         if (isObj(fromTarget)) {
      //           THEN_DISABLED_WS.add(fromTarget);
      //         }
      //         retPo.resolve(thenFun(fromTarget));
      //       }
      //       return;
      //     }
      //     safePromiseThen(doApply(asyncValue, thisArg, argArray), retPo.resolve, retPo.reject);
      //   },
      //   retPo.reject,
      // );
      // return createAsyncValueProxy(retPo, undefined, {
      //   get target() {
      //     return asyncProxyCacher.get();
      //   },
      //   paths: from.paths.concat(`<apply>(~${argArray.length}parmas)`),
      // });
    },
    construct: (_target, argArray, newTarget) => {
      return holderReflect.construct(argArray, newTarget);

      // const insPo = new PromiseOut<BFChainComlink.AsyncUtil.InstanceType<T>>();
      // openAsAsyncValue(
      //   holderReflect,
      //   (asyncValue) =>
      //     safePromiseThen(
      //       doConstruct(asyncValue, argArray, newTarget),
      //       insPo.resolve,
      //       insPo.reject,
      //     ),
      //   insPo.reject,
      // );
      // return createAsyncValueProxy(insPo, undefined, {
      //   get target() {
      //     return asyncProxyCacher.get();
      //   },
      //   paths: from.paths.concat(`<new>(~${argArray.length}parmas)`),
      // });
    },
  };
  return proxyHanlder;
}

// /**
//  * 这里需要私底下自己托管一套Proxy的创建
//  * 直接使用AsyncValue进行创建，和 ComlinkCore 内创建规则的不一样
//  * 而且这套是会频繁被释放
//  * @param asyncValue
//  * @param source
//  * @param from
//  */
// function createAsyncValueProxy<T>(
//   asyncValue: BFChainComlink.AsyncValue<T> | PromiseOut<BFChainComlink.AsyncValue<T>>,
//   source: object = function () {},
// ) {
//   if (!isObj(asyncValue)) {
//     return asyncValue as T;
//   }
//   const asyncReflectValue = (asyncValue as unknown) as MaybeHolderReflectPromiseOut;

//   let proxy = TARGET_PROXY_WM.get(asyncReflectValue);
//   if (!proxy) {
//     proxy = new Proxy(source, createHolderProxyHanlder(asyncReflectValue, source));

//     TARGET_PROXY_WM.set(asyncReflectValue, proxy);
//     PROXY_TARGET_WM.set(proxy, asyncReflectValue);
//   }

//   return (proxy as unknown) as T;
// }
