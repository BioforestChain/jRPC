import { EmscriptenReflect } from "@bfchain/comlink-typings";

export const ESM_REFLECT_FUN_MAP = new Map([
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
]);
