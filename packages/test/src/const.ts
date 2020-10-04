export const enum IOB_Type {
  /**克隆 */
  Clone,
  /**符号对象
   * 这个是比较特殊的存在，理论上属于Clone，但是是属于特殊的引用克隆
   */
  RemoteSymbol,
  /**本地符号引用 */
  LocalSymbol,
  /**远端引用（必须是之前已经新建过的） */
  Ref,
  //   /**新建远端引用 */
  //   NewRef,
  /**本地引用 */
  Locale,
  //   /**默认引用 */
  //   Default,
}

export const enum IOB_Extends_Type {
  Function,
  Object,
  Symbol,
}

//#region IOB_Extends::Function

/**函数的类型 */
export const enum IOB_Extends_Function_Type {
  _GeneratorFlag = 1 << 0,
  Sync = 1 << 1,
  SyncGenerator = IOB_Extends_Function_Type.Sync | IOB_Extends_Function_Type._GeneratorFlag,
  Async = 1 << 2,
  AsyncGenerator = IOB_Extends_Function_Type.Async | IOB_Extends_Function_Type._GeneratorFlag,
  Class = 1 << 3,
}
/**函数类型对应的构造函数 */
export const IOB_EFT_Factory_Map = new Map([
  [
    IOB_Extends_Function_Type.Sync,
    {
      factory: Function,
      toString: (refExtends: EmscriptionLinkRefExtends.RefFunctionItemExtends) =>
        `${refExtends.name}() { [remote code] }`,
    },
  ],
]);
for (const [funType, { factoryCode, toString }] of [
  [
    IOB_Extends_Function_Type.SyncGenerator,
    {
      factoryCode: "return function* () {}.constructor",
      toString: (refExtends: EmscriptionLinkRefExtends.RefFunctionItemExtends) =>
        `*${refExtends.name}() { [remote code] }`,
    },
  ],
  [
    IOB_Extends_Function_Type.Async,
    {
      factoryCode: "return async function () {}.constructor",
      toString: (refExtends: EmscriptionLinkRefExtends.RefFunctionItemExtends) =>
        `async ${refExtends.name}() { [remote code] }`,
    },
  ],
  [
    IOB_Extends_Function_Type.AsyncGenerator,
    {
      factoryCode: "return async function* () {}.constructor",
      toString: (refExtends: EmscriptionLinkRefExtends.RefFunctionItemExtends) =>
        `async *${refExtends.name}() { [remote code] }`,
    },
  ],
  [
    IOB_Extends_Function_Type.Class,
    {
      factoryCode: "return ()=>class {}",
      toString: (refExtends: EmscriptionLinkRefExtends.RefFunctionItemExtends) =>
        `class ${refExtends.name} { [remote code] }`,
    },
  ],
] as const) {
  let factory: FunctionConstructor;
  try {
    factory = Function(factoryCode)();
  } catch {
    factory = Function;
  }
  IOB_EFT_Factory_Map.set(funType, { factory, toString });
}

export function getFunctionType(fun: Function) {
  const ctor = fun.constructor;
  if (ctor) {
    const ctorName = ctor.name;
    if (ctorName === "AsyncGeneratorFunction") {
      return IOB_Extends_Function_Type.AsyncGenerator;
    }
    if (ctorName === "AsyncFunction") {
      return IOB_Extends_Function_Type.Async;
    }
    if (ctorName === "GeneratorFunction") {
      return IOB_Extends_Function_Type.SyncGenerator;
    }
  }
  const str = Object.toString.call(fun);
  if (str.startsWith("class")) {
    return IOB_Extends_Function_Type.Class;
  }
  return IOB_Extends_Function_Type.Sync;
}

/**导出者 用于描述一个 function 的导出配置 */
export const EXPORT_FUN_DESCRIPTOR_SYMBOL = Symbol("function.export");
/**导入者 缓存一个 function 的导入信息 */
export const IMPORT_FUN_EXTENDS_SYMBOL = Symbol("function.import");

/**
 * 用于替代 RefFunction 的 Function.property.toString
 * @param this
 */
export function refFunctionToStringFactory() {
  function toString(this: Function) {
    // if (this === toString) {
    //   return "function toString() { [remote code] }";
    // }
    const refExtends: EmscriptionLinkRefExtends.RefFunctionItemExtends = Reflect.get(
      this,
      IMPORT_FUN_EXTENDS_SYMBOL,
    );
    if (refExtends.sourceCode === undefined) {
      return IOB_EFT_Factory_Map.get(refExtends.funType)!.toString(refExtends);
    } else {
      return refExtends.sourceCode;
    }
  }
  /**使用Proxy保护源码 */
  const proxy = new Proxy(toString, {});
  return proxy;
}

//#endregion

//#region IOB_Extends::Object

export const enum IOB_Extends_Object_Status {
  /**可添加属性 */
  add = 1 << 0,
  /**可修改属性 */
  update = 1 << 1,
  /**可删除属性 */
  delete = 1 << 2,
  /**自由状态：默认状态 */
  freedom = IOB_Extends_Object_Status.add |
    IOB_Extends_Object_Status.update |
    IOB_Extends_Object_Status.delete,

  /**禁止拓展：使用 Object.preventExtensions 修改对象状态 */
  preventedExtensions = IOB_Extends_Object_Status.add | IOB_Extends_Object_Status.update,
  /**封闭对象：使用 Object.seal 封闭对象状态 */
  sealed = IOB_Extends_Object_Status.update,
  /**冻结对象：使用 Object.freeze 冻结对象 */
  frozen = 0,
}

export function getObjectStatus(obj: Object) {
  if (Object.isFrozen(obj)) {
    return IOB_Extends_Object_Status.frozen;
  }
  if (Object.isSealed(obj)) {
    return IOB_Extends_Object_Status.sealed;
  }
  if (Object.isExtensible(obj)) {
    return IOB_Extends_Object_Status.preventedExtensions;
  }
  return IOB_Extends_Object_Status.freedom;
}
//#endregion

//#region IOB_Extends::Symbol

export const globalSymbolStore = new Map<string | symbol, { name: string; sym: symbol }>();

[
  "asyncIterator",
  "hasInstance",
  "isConcatSpreadable",
  "iterator",
  "match",
  "matchAll",
  "replace",
  "search",
  "species",
  "split",
  "toPrimitive",
  "toStringTag",
  "unscopables",
].forEach((name) => {
  const sym = Reflect.get(Symbol, name);
  if (typeof sym === "symbol") {
    const cache = {
      sym,
      name,
    };
    globalSymbolStore.set(sym, cache);
    globalSymbolStore.set(name, cache);
  }
});

//#endregion
