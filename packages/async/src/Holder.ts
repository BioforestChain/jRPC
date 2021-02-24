import type {} from "@bfchain/util-typings";
import type { HolderReflect } from "./HolderReflect";

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
  const proxyHanlder: BFChainLink.EmscriptionProxyHanlder<T> = {
    getPrototypeOf: () => {
      return null;
    },
    setPrototypeOf: () => {
      throw new Error("no support AsyncReflect.setPrototypeOf");
      // return false;
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
          resolve: (v: BFChainLink.AsyncUtil.Get<T, K> | BFChainLink.AsyncValue<T>) => void,
          reject: (err: unknown) => void,
        ) => {
          holderReflect.toValueSync((ret) => {
            if (ret.isError) {
              return reject(ret.error);
            }

            if (isHolder(ret.data)) {
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
                  /// 下面的resolve会导致再次触发then，所以这里要一次性进行then禁用
                  __THEN_DISABLED__.add(holderReflect);
                  resolve(ret.data);
                }
              });
            } else {
              /// 如果是一个本地对象
              if (ret.data && typeof (ret.data as never)["then"] === "function") {
                // 这个promise没人捕捉，也不需要捕捉
                (ret.data as PromiseLike<BFChainLink.AsyncUtil.Get<T, K>>).then(resolve, reject);
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
      const setHolderReflect = holderReflect.setHolder(prop, value);
      let res = true;
      setHolderReflect.toValueSync((ret) => {
        if (ret.isError === false) {
          res = ret.data;
        }
      });
      return res;
    },
    deleteProperty: (target: T, prop: keyof T) => {
      const setHolderReflect = holderReflect.deletePropertyHolder(prop);
      let res = true;
      setHolderReflect.toValueSync((ret) => {
        if (ret.isError === false) {
          res = ret.data;
        }
      });
      return res;
    },
    apply: (_target, thisArg, argArray) => {
      // holderReflect.toHolder()===thisArg
      // getHolderReflect(thisArg) === holderReflect;
      const applyHolderReflect = holderReflect.unpromisifyApplyHolder(thisArg, argArray);
      applyHolderReflect.toValueSync(() => {
        ///强行调取触发指令发送
      });
      return applyHolderReflect.toAsyncValue();
    },
    construct: (_target, argArray, newTarget) => {
      const constructHolderReflect = holderReflect.constructHolder(argArray, newTarget);
      constructHolderReflect.toValueSync(() => {
        ///强行调取触发指令发送
      });
      return constructHolderReflect.toAsyncValue();
    },
  };
  return proxyHanlder;
}

const __HOLDER_REFLECT_WM__ = new WeakMap<BFChainLink.Holder<any>, HolderReflect<any>>();
const __REFLECT_HOLDER_WM__ = new WeakMap<HolderReflect<any>, BFChainLink.Holder<any>>();

export function getHolder<T>(holderReflect: HolderReflect<T>) {
  let holder = __REFLECT_HOLDER_WM__.get(holderReflect) as BFChainLink.Holder<T>;
  if (holder === undefined) {
    holder = new Proxy(
      Function(`return function ${holderReflect.name}(){}`)(),
      createHolderProxyHanlder(holderReflect as any),
    );
    __HOLDER_REFLECT_WM__.set(holder, holderReflect);
    __REFLECT_HOLDER_WM__.set(holderReflect, holder);
  }
  return holder;
}
export function isHolder(target: unknown): target is BFChainLink.Holder {
  return __HOLDER_REFLECT_WM__.has(target as never);
}
export function getHolderReflect<T>(
  target: BFChainLink.Holder<T> | unknown,
): HolderReflect<T> | undefined {
  return __HOLDER_REFLECT_WM__.get(target as never) as HolderReflect<T> | undefined;
}
