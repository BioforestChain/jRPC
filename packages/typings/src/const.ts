export const enum LinkObjType {
  /**获取导入的入口信息 */
  Import,
  /**响应Import */
  Export,
  /**指令请求 */
  In,
  /**响应In */
  Out,
  /**通知释放，由import（使用方）通知export（供给方）释放 */
  Release,
  /**@TODO 实现对象变更推送
   * 比如引用对象的配置信息
   */
  // Notify
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

  /**运算符操作 */
  Asset,
  Typeof,
  Instanceof,
  /**内置函数操作 */
  JsonStringify,
  JsonParse,
  /**批量操作 */
  Multi,
  /**强制异步转同步 */
  SyncApply,
  /**强制同步转异步 */
  AsyncApply,
}
