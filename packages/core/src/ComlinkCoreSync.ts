import { EmscriptenReflect } from "@bfchain/comlink-typings";
import { ComlinkCore } from "./ComlinkCore";

const CB_TO_SYNC_ERROR = new SyntaxError("could not transfrom to sync function");

export function CallbackToSync<R, ARGS extends unknown[]>(
  cbCaller: (cb: BFChainComlink.Callback<R>, ...args: ARGS) => void,
  args: ARGS,
  ctx: unknown,
) {
  let ret = {
    isError: true,
    error: CB_TO_SYNC_ERROR,
  } as BFChainComlink.CallbackArg<R>;
  debugger;
  cbCaller.call(ctx, (_ret) => (ret = _ret), ...args);
  if (ret.isError) {
    throw ret.error;
  }
  return ret.data;
}

export abstract class ComlinkCoreSync<IOB /*  = unknown */, TB /*  = unknown */, IMP_EXTENDS>
  extends ComlinkCore<IOB, TB, IMP_EXTENDS>
  implements BFChainComlink.ComlinkCoreSync {
  export(target: unknown, name?: string): void {
    this.$export(target, name);
  }

  protected $getDefaultProxyHanlder<T extends object>(
    port: BFChainComlink.BinaryPort<TB>,
    refId: number,
  ) {
    const send = <R = unknown>(linkIn: unknown[], hasOut: boolean) =>
      CallbackToSync(this.$sendLinkIn, [port, refId, linkIn, hasOut], this) as R;

    const proxyHandler: BFChainComlink.EmscriptionProxyHanlder<T> = {
      getPrototypeOf: (_target) => send<object | null>([EmscriptenReflect.GetPrototypeOf], true),
      setPrototypeOf: (_target, proto) =>
        send<boolean>([EmscriptenReflect.SetPrototypeOf, proto], true),
      isExtensible: (target) => send<boolean>([EmscriptenReflect.IsExtensible], true),
      preventExtensions: (_target) => send<boolean>([EmscriptenReflect.PreventExtensions], true),
      getOwnPropertyDescriptor: (_target, prop: PropertyKey) =>
        send<PropertyDescriptor | undefined>(
          [EmscriptenReflect.GetOwnPropertyDescriptor, prop],
          true,
        ),
      has: (_target, prop: PropertyKey) => send<boolean>([EmscriptenReflect.Has], true),
      /**导入子模块 */
      get: (_target, prop, _reciver) =>
        // console.log("get", prop),
        send<boolean>([EmscriptenReflect.Get, prop], true),
      /**发送 set 操作 */
      set: (_target, prop: PropertyKey, value: any, receiver: any) => (
        send<boolean>([EmscriptenReflect.Set, prop, value], false), true
      ),
      deleteProperty: (_target, prop: PropertyKey) => (
        send([EmscriptenReflect.DeleteProperty, prop], false), true
      ),
      defineProperty: (_target, prop: PropertyKey, attr: PropertyDescriptor) => (
        send([EmscriptenReflect.DefineProperty, prop, attr], false), true
      ),
      ownKeys: (_target) => send([EmscriptenReflect.OwnKeys], true),
      apply: (_target, thisArg, argArray) =>
        send([EmscriptenReflect.Apply, thisArg, ...argArray], true),
      construct: (_target, argArray, newTarget) =>
        send([EmscriptenReflect.Construct, newTarget, ...argArray], true),
    };
    return proxyHandler;
  }
  import<T>(key = "default") {
    return CallbackToSync(this.$import, [key], this) as T;
  }
}
