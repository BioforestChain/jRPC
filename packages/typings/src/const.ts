export const enum LinkObjType {
  /**获取导入的入口信息 */
  Import,
  /**响应Import */
  Export,
  /**指令请求 */
  In,
  /**响应In */
  Out,
  /**通知释放 */
  Release,
}

export const enum LinkOperatorType {
  /**对于函数来说，一共只有一个协议，就是 Call 调用
   * JS语言在此基础上进行扩展，从而模拟JS的各种操作（如果其它语言要使用JS的操作，也需要遵循如此协议才能达成效果）：
   * 其标准遵循 Reflect
   */
  CALL,
}

export const enum EmscriptenReflect {
  GetPrototypeOf,
  SetPrototypeOf,
  IsExtensible,
  PreventExtensions,
  GetOwnPropertyDescriptor,
  Has,
  Get,
  Set,
  DeleteProperty,
  DefineProperty,
  OwnKeys,
  Apply,
  Construct,

  /**
   * typeof 无法代理，所以则需要一个对象在返回的时候，一并返回它的基础类型
   */
  _Typeof,
}

export const ESM_REFLECT_FUN_MAP = new Map([
  [
    EmscriptenReflect.GetPrototypeOf,
    (target: object) => Reflect.getPrototypeOf(target),
  ],
  [
    EmscriptenReflect.SetPrototypeOf,
    (target: object, [proto]: unknown[]) =>
      Reflect.setPrototypeOf(target, proto),
  ],
  [
    EmscriptenReflect.IsExtensible,
    (target: object) => Reflect.isExtensible(target),
  ],
  [
    EmscriptenReflect.PreventExtensions,
    (target: object) => Reflect.preventExtensions(target),
  ],
  [
    EmscriptenReflect.GetOwnPropertyDescriptor,
    (target: object, [prop]: unknown[]) =>
      Reflect.getOwnPropertyDescriptor(target, prop as PropertyKey),
  ],
  [
    EmscriptenReflect.Has,
    (target: object, [prop]: unknown[]) =>
      Reflect.has(target, prop as PropertyKey),
  ],
  [
    EmscriptenReflect.Get,
    (target: object, [prop]: unknown[]) =>
      Reflect.get(target, prop as PropertyKey),
  ],
  [
    EmscriptenReflect.Set,
    (target: object, [prop, value]: unknown[]) =>
      Reflect.set(target, prop as PropertyKey, value),
  ],
  [
    EmscriptenReflect.DeleteProperty,
    (target: object, [prop]: unknown[]) =>
      Reflect.deleteProperty(target, prop as PropertyKey),
  ],
  [
    EmscriptenReflect.DefineProperty,
    (target: object, [prop, attr]: unknown[]) =>
      Reflect.defineProperty(
        target,
        prop as PropertyKey,
        attr as PropertyDescriptor
      ),
  ],
  [EmscriptenReflect.OwnKeys, (target: object) => Reflect.ownKeys(target)],
  [
    EmscriptenReflect.Apply,
    (target: object, [ctx, args]: unknown[]) =>
      Reflect.apply(target as Function, ctx, args as ArrayLike<unknown>),
  ],
  [
    EmscriptenReflect.Construct,
    (target: object, [args, newTarget]: unknown[]) =>
      Reflect.construct(
        target as Function,
        args as ArrayLike<unknown>,
        newTarget
      ),
  ],
]);
