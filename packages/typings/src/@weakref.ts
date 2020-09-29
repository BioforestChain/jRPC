interface WeakRef<T extends object = object> {
  readonly [Symbol.toStringTag]: "WeakRef";

  /**
   * 返回对象本身，如果已经被释放，则返回 undefined
   */
  deref(): T | undefined;
}

interface WeakRefConstructor {
  readonly prototype: WeakRef<object>;
  /**
   * 创建实例
   */
  new <T extends object = object>(target: T): WeakRef<T>;
}

declare const WeakRef: WeakRefConstructor;

interface FinalizationRegistry {
  readonly [Symbol.toStringTag]: "FinalizationRegistry";
  /**
   * 注册监听
   * @param target 要进行回收监听的对象
   * @param heldValue 保留值，用来描述被回收的对象
   * @param unregisterToken 用于取消监听的唯一令牌
   */
  register(target: object, heldValue: unknown, unregisterToken?: object): void;
  /**
   * 取消监听
   * @param unregisterToken
   */
  unregister(unregisterToken: object): void;
}
interface FinalizationRegistryConstructor {
  readonly prototype: FinalizationRegistry;

  /**
   * 创建一个回收前的回调
   * heldValue: 保留值
   */
  new (cleanupCallback: (heldValue: unknown) => unknown): FinalizationRegistry;
}
declare const FinalizationRegistry: FinalizationRegistryConstructor;

type FinalizationGroup = FinalizationRegistry;
interface FinalizationGroupConstructor {
  readonly prototype: FinalizationGroup;

  /**
   * 创建一个回收前的回调
   * heldValue: 保留值
   */
  new (
    cleanupCallback: (cleanupIterator: Iterable<unknown>) => unknown
  ): FinalizationGroup;
}
declare const FinalizationGroup: FinalizationGroupConstructor;
