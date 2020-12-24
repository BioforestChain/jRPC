import type {} from "@bfchain/util-typings";
import { EmscriptenReflect } from "@bfchain/comlink-typings";
import { HolderReflect } from "./HolderReflect";
import { helper } from "@bfchain/comlink-core";

const noSupportHolderToPrimitive = (hint: string) =>
  new TypeError(
    `holder could not transfrom to ${hint} primitive, use await HolderRelect.to${hint.replace(
      "^[a-z]",
      (_) => _.toUpperCase(),
    )} to alertnative.`,
  );

const NO_ALLOW_PROP = new Set([
  Symbol.toPrimitive,
  Symbol.toStringTag,
  Symbol.hasInstance,
  Symbol.species,
  /// 不能直接支持Symbol.iterator，只能用Symbol.asyncIterator来替代Symbol.iterator
  Symbol.iterator,
  // Symbol.asyncIterator,
  Symbol.isConcatSpreadable,
  Symbol.match,
  Symbol.matchAll,
  Symbol.replace,
  Symbol.search,
  Symbol.split,
]);

const __THEN_DISABLED__ = new WeakSet();

export function createHolderProxyHanlder<T extends object>(holderReflect: HolderReflect<T>) {
  const proxyHanlder: BFChainComlink.EmscriptionProxyHanlder<T> = {
    getPrototypeOf: () => {
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
      // 禁止支持一些特定的symbol
      if (NO_ALLOW_PROP.has(prop as symbol)) {
        return;
      }
      if (prop === "then") {
        /// 一次性
        if (__THEN_DISABLED__.delete(holderReflect)) {
          return;
        }
        return (
          resolve: (v: BFChainComlink.AsyncUtil.Get<T, K> | BFChainComlink.AsyncValue<T>) => void,
          reject: (err: unknown) => void,
        ) => {
          holderReflect.toValueSync((ret) => {
            if (ret.isError) {
              return reject(ret.error);
            }

            if (HolderReflect.isHolder(ret.data)) {
              /// 如果是一个远端对象
              const thenFun = holderReflect.assetHolder("then");
              thenFun.Operator_typeOfHolder().toValueSync((typeNameRet) => {
                if (typeNameRet.isError) {
                  return reject(typeNameRet.error);
                }
                if (typeNameRet.data === "function") {
                  thenFun
                    .applyHolder(holderReflect.toHolder(), [resolve, reject] as never)
                    .toValueSync(() => {
                      // 这个promise没人捕捉，也不需要捕捉
                    });
                } else {
                  __THEN_DISABLED__.add(holderReflect);
                  resolve(ret.data);
                }
              });
            } else {
              /// 如果是一个本地对象
              if (ret.data && typeof (ret.data as never)["then"] === "function") {
                // 这个promise没人捕捉，也不需要捕捉
                (ret.data as PromiseLike<BFChainComlink.AsyncUtil.Get<T, K>>).then(resolve, reject);
              } else {
                resolve(ret.data);
              }
            }
          });
        };
      }
      /**迭代器的支持 */
      if (prop === Symbol.asyncIterator) {
        return async function* () {
          if (await holderReflect.has(Symbol.asyncIterator)) {
            yield* holderReflect.asyncIterator();
          } else {
            yield* holderReflect.iterator();
          }
        };
      }

      return holderReflect.assetHolder(prop).toAsyncValue();
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
      return holderReflect.applyHolder(thisArg, argArray).toAsyncValue();
    },
    construct: (_target, argArray, newTarget) => {
      return holderReflect.constructHolder(argArray, newTarget).toAsyncValue();
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
