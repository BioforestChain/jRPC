import "./@types";
export const enum ESM_BUILD_IN_OBJECT {
  /// Fundamental objects
  Object,
  Object_Prototype,
  Function,
  Function_Prototype,
  Boolean,
  Boolean_Prototype,
  Symbol,
  Symbol_Prototype,
  /// Error objects
  Error,
  Error_Prototype,
  AggregateError,
  AggregateError_Prototype,
  EvalError,
  EvalError_Prototype,
  InternalError,
  InternalError_Prototype,
  RangeError,
  RangeError_Prototype,
  ReferenceError,
  ReferenceError_Prototype,
  TypeError,
  TypeError_Prototype,
  URIError,
  URIError_Prototype,
  /// Numbers and dates
  Number,
  Number_Prototype,
  BigInt,
  BigInt_Prototype,
  Math,
  Date,
  Date_Prototype,
  /// Text processing
  String,
  String_Prototype,
  RegExp,
  RegExp_Prototype,
  /// Indexed collections
  Array,
  Array_Prototype,
  Int8Array,
  Int8Array_Prototype,
  Uint8Array,
  Uint8Array_Prototype,
  Uint8ClampedArray,
  Uint8ClampedArray_Prototype,
  Int16Array,
  Int16Array_Prototype,
  Uint16Array,
  Uint16Array_Prototype,
  Int32Array,
  Int32Array_Prototype,
  Uint32Array,
  Uint32Array_Prototype,
  Float32Array,
  Float32Array_Prototype,
  Float64Array,
  Float64Array_Prototype,
  BigInt64Array,
  BigInt64Array_Prototype,
  BigUint64Array,
  BigUint64Array_Prototype,
  /// Keyed collections
  Map,
  Map_Prototype,
  Set,
  Set_Prototype,
  WeakMap,
  WeakMap_Prototype,
  WeakSet,
  WeakSet_Prototype,
  /// Structured data
  ArrayBuffer,
  ArrayBuffer_Prototype,
  SharedArrayBuffer,
  SharedArrayBuffer_Prototype,
  Atomics,
  DataView,
  DataView_Prototype,
  JSON,
  /// Control abstraction objects
  Promise,
  GeneratorFunction,
  GeneratorFunction_Prototype, //Generator,
  AsyncFunction,
  AsyncFunction_Prototype,
  AsyncGeneratorFunction,
  AsyncGeneratorFunction_Prototype, //AsyncGenerator,
  /// Reflection
  Reflect,
  Proxy, // 这是唯一一个没有prototype的function
  /// Internationalization
  Intl,
  Intl_Collator,
  Intl_Collator_Prototype,
  Intl_DateTimeFormat,
  Intl_DateTimeFormat_Prototype,
  Intl_ListFormat,
  Intl_ListFormat_Prototype,
  Intl_NumberFormat,
  Intl_NumberFormat_Prototype,
  Intl_PluralRules,
  Intl_PluralRules_Prototype,
  Intl_RelativeTimeFormat,
  Intl_RelativeTimeFormat_Prototype,
  Intl_Locale,
  Intl_Locale_Prototype,
  /// WebAssembly
  WebAssembly,
  WebAssembly_Module,
  WebAssembly_Module_Prototype,
  WebAssembly_Instance,
  WebAssembly_Instance_Prototype,
  WebAssembly_Memory,
  WebAssembly_Memory_Prototype,
  WebAssembly_Table,
  WebAssembly_Table_Prototype,
  WebAssembly_CompileError,
  WebAssembly_CompileError_Prototype,
  WebAssembly_LinkError,
  WebAssembly_LinkError_Prototype,
  WebAssembly_RuntimeError,
  WebAssembly_RuntimeError_Prototype,
  /// arguments: 无
}

type EsmBuildInObjectKeyValueItem = [ESM_BUILD_IN_OBJECT, any];

export const EsmBuildInObjectKeyValueList: readonly EsmBuildInObjectKeyValueItem[] = Object.freeze([
  /// Fundamental objects
  [ESM_BUILD_IN_OBJECT.Object, Object],
  [ESM_BUILD_IN_OBJECT.Object_Prototype, Object.prototype],
  [ESM_BUILD_IN_OBJECT.Function, Function],
  [ESM_BUILD_IN_OBJECT.Function_Prototype, Function.prototype],
  [ESM_BUILD_IN_OBJECT.Boolean, Boolean],
  [ESM_BUILD_IN_OBJECT.Boolean_Prototype, Boolean.prototype],
  [ESM_BUILD_IN_OBJECT.Symbol, Symbol],
  [ESM_BUILD_IN_OBJECT.Symbol_Prototype, Symbol.prototype],
  /// Error objects
  [ESM_BUILD_IN_OBJECT.Error, Error],
  [ESM_BUILD_IN_OBJECT.Error_Prototype, Error.prototype],
  ...(() => {
    if (typeof AggregateError === "function") {
      return [
        [ESM_BUILD_IN_OBJECT.AggregateError, AggregateError],
        [ESM_BUILD_IN_OBJECT.AggregateError_Prototype, AggregateError.prototype],
      ] as EsmBuildInObjectKeyValueItem[];
    }
    return [];
  })(),
  [ESM_BUILD_IN_OBJECT.EvalError, EvalError],
  [ESM_BUILD_IN_OBJECT.EvalError_Prototype, EvalError.prototype],
  ...(() => {
    if (typeof InternalError === "function") {
      return [
        [ESM_BUILD_IN_OBJECT.InternalError, InternalError],
        [ESM_BUILD_IN_OBJECT.InternalError_Prototype, InternalError.prototype],
      ] as EsmBuildInObjectKeyValueItem[];
    }
    return [];
  })(),
  [ESM_BUILD_IN_OBJECT.RangeError, RangeError],
  [ESM_BUILD_IN_OBJECT.RangeError_Prototype, RangeError.prototype],
  [ESM_BUILD_IN_OBJECT.ReferenceError, ReferenceError],
  [ESM_BUILD_IN_OBJECT.ReferenceError_Prototype, ReferenceError.prototype],
  [ESM_BUILD_IN_OBJECT.TypeError, TypeError],
  [ESM_BUILD_IN_OBJECT.TypeError_Prototype, TypeError.prototype],
  [ESM_BUILD_IN_OBJECT.URIError, URIError],
  [ESM_BUILD_IN_OBJECT.URIError_Prototype, URIError.prototype],
  /// Numbers and dates
  [ESM_BUILD_IN_OBJECT.Number, Number],
  [ESM_BUILD_IN_OBJECT.Number_Prototype, Number.prototype],
  [ESM_BUILD_IN_OBJECT.BigInt, BigInt],
  [ESM_BUILD_IN_OBJECT.BigInt_Prototype, BigInt.prototype],
  [ESM_BUILD_IN_OBJECT.Math, Math],
  [ESM_BUILD_IN_OBJECT.Date, Date],
  [ESM_BUILD_IN_OBJECT.Date_Prototype, Date.prototype],
  /// Text processing
  [ESM_BUILD_IN_OBJECT.String, String],
  [ESM_BUILD_IN_OBJECT.String_Prototype, String.prototype],
  [ESM_BUILD_IN_OBJECT.RegExp, RegExp],
  [ESM_BUILD_IN_OBJECT.RegExp_Prototype, RegExp.prototype],
  /// Indexed collections
  [ESM_BUILD_IN_OBJECT.Array, Array],
  [ESM_BUILD_IN_OBJECT.Array_Prototype, Array.prototype],
  [ESM_BUILD_IN_OBJECT.Int8Array, Int8Array],
  [ESM_BUILD_IN_OBJECT.Int8Array_Prototype, Int8Array.prototype],
  [ESM_BUILD_IN_OBJECT.Uint8Array, Uint8Array],
  [ESM_BUILD_IN_OBJECT.Uint8Array_Prototype, Uint8Array.prototype],
  [ESM_BUILD_IN_OBJECT.Uint8ClampedArray, Uint8ClampedArray],
  [ESM_BUILD_IN_OBJECT.Uint8ClampedArray_Prototype, Uint8ClampedArray.prototype],
  [ESM_BUILD_IN_OBJECT.Int16Array, Int16Array],
  [ESM_BUILD_IN_OBJECT.Int16Array_Prototype, Int16Array.prototype],
  [ESM_BUILD_IN_OBJECT.Uint16Array, Uint16Array],
  [ESM_BUILD_IN_OBJECT.Uint16Array_Prototype, Uint16Array.prototype],
  [ESM_BUILD_IN_OBJECT.Int32Array, Int32Array],
  [ESM_BUILD_IN_OBJECT.Int32Array_Prototype, Int32Array.prototype],
  [ESM_BUILD_IN_OBJECT.Uint32Array, Uint32Array],
  [ESM_BUILD_IN_OBJECT.Uint32Array_Prototype, Uint32Array.prototype],
  [ESM_BUILD_IN_OBJECT.Float32Array, Float32Array],
  [ESM_BUILD_IN_OBJECT.Float32Array_Prototype, Float32Array.prototype],
  [ESM_BUILD_IN_OBJECT.Float64Array, Float64Array],
  [ESM_BUILD_IN_OBJECT.Float64Array_Prototype, Float64Array.prototype],
  [ESM_BUILD_IN_OBJECT.BigInt64Array, BigInt64Array],
  [ESM_BUILD_IN_OBJECT.BigInt64Array_Prototype, BigInt64Array.prototype],
  [ESM_BUILD_IN_OBJECT.BigUint64Array, BigUint64Array],
  [ESM_BUILD_IN_OBJECT.BigUint64Array_Prototype, BigUint64Array.prototype],
  /// Keyed collections
  [ESM_BUILD_IN_OBJECT.Map, Map],
  [ESM_BUILD_IN_OBJECT.Map_Prototype, Map.prototype],
  [ESM_BUILD_IN_OBJECT.Set, Set],
  [ESM_BUILD_IN_OBJECT.Set_Prototype, Set.prototype],
  [ESM_BUILD_IN_OBJECT.WeakMap, WeakMap],
  [ESM_BUILD_IN_OBJECT.WeakMap_Prototype, WeakMap.prototype],
  [ESM_BUILD_IN_OBJECT.WeakSet, WeakSet],
  [ESM_BUILD_IN_OBJECT.WeakSet_Prototype, WeakSet.prototype],
  /// Structured data
  [ESM_BUILD_IN_OBJECT.ArrayBuffer, ArrayBuffer],
  [ESM_BUILD_IN_OBJECT.ArrayBuffer_Prototype, ArrayBuffer.prototype],
  [ESM_BUILD_IN_OBJECT.SharedArrayBuffer, SharedArrayBuffer],
  [ESM_BUILD_IN_OBJECT.SharedArrayBuffer_Prototype, SharedArrayBuffer.prototype],
  [ESM_BUILD_IN_OBJECT.Atomics, Atomics],
  [ESM_BUILD_IN_OBJECT.DataView, DataView],
  [ESM_BUILD_IN_OBJECT.DataView_Prototype, DataView.prototype],
  [ESM_BUILD_IN_OBJECT.JSON, JSON],
  /// Control abstraction objects
  [ESM_BUILD_IN_OBJECT.Promise, Promise],
  ...(() => {
    const res: EsmBuildInObjectKeyValueItem[] = [];
    try {
      const GeneratorFunction = Function("return (function*(){}).constructor")();
      res.push(
        [ESM_BUILD_IN_OBJECT.GeneratorFunction, GeneratorFunction],
        [ESM_BUILD_IN_OBJECT.GeneratorFunction_Prototype, GeneratorFunction.prototype],
      );
    } catch {}
    try {
      const AsyncFunction = Function("return (async()=>{}).constructor")();
      res.push(
        [ESM_BUILD_IN_OBJECT.AsyncFunction, AsyncFunction],
        [ESM_BUILD_IN_OBJECT.AsyncFunction_Prototype, AsyncFunction.prototype],
      );
    } catch {}
    try {
      const AsyncGeneratorFunction = Function("return (async function*(){}).constructor")();
      res.push(
        [ESM_BUILD_IN_OBJECT.AsyncGeneratorFunction, AsyncGeneratorFunction],
        [ESM_BUILD_IN_OBJECT.AsyncGeneratorFunction_Prototype, AsyncGeneratorFunction.prototype],
      );
    } catch {}
    return res;
  })(),
  /// Reflection
  [ESM_BUILD_IN_OBJECT.Reflect, Reflect],
  [ESM_BUILD_IN_OBJECT.Proxy, Proxy], // 这是唯一一个没有prototype的function
  /// Internationalization
  ...(() => {
    const res: EsmBuildInObjectKeyValueItem[] = [];
    if (typeof Intl !== "object") {
      return res;
    }
    res.push([ESM_BUILD_IN_OBJECT.Intl, Intl]);
    if (Intl.Collator) {
      res.push(
        [ESM_BUILD_IN_OBJECT.Intl_Collator, Intl.Collator],
        [ESM_BUILD_IN_OBJECT.Intl_Collator_Prototype, Intl.Collator.prototype],
      );
    }
    if (Intl.DateTimeFormat) {
      res.push(
        [ESM_BUILD_IN_OBJECT.Intl_DateTimeFormat, Intl.DateTimeFormat],
        [ESM_BUILD_IN_OBJECT.Intl_DateTimeFormat_Prototype, Intl.DateTimeFormat.prototype],
      );
    }
    if (Intl.ListFormat) {
      res.push(
        [ESM_BUILD_IN_OBJECT.Intl_ListFormat, Intl.ListFormat],
        [ESM_BUILD_IN_OBJECT.Intl_ListFormat_Prototype, Intl.ListFormat.prototype],
      );
    }
    if (Intl.NumberFormat) {
      res.push(
        [ESM_BUILD_IN_OBJECT.Intl_NumberFormat, Intl.NumberFormat],
        [ESM_BUILD_IN_OBJECT.Intl_NumberFormat_Prototype, Intl.NumberFormat.prototype],
      );
    }
    if (Intl.PluralRules) {
      res.push(
        [ESM_BUILD_IN_OBJECT.Intl_PluralRules, Intl.PluralRules],
        [ESM_BUILD_IN_OBJECT.Intl_PluralRules_Prototype, Intl.PluralRules.prototype],
      );
    }
    if (Intl.RelativeTimeFormat) {
      res.push(
        [ESM_BUILD_IN_OBJECT.Intl_RelativeTimeFormat, Intl.RelativeTimeFormat],
        [ESM_BUILD_IN_OBJECT.Intl_RelativeTimeFormat_Prototype, Intl.RelativeTimeFormat.prototype],
      );
    }
    if (Intl.Locale) {
      res.push(
        [ESM_BUILD_IN_OBJECT.Intl_Locale, Intl.Locale],
        [ESM_BUILD_IN_OBJECT.Intl_Locale_Prototype, Intl.Locale.prototype],
      );
    }
    return res;
  })(),
  /// WebAssembly
  ...(() => {
    const res: EsmBuildInObjectKeyValueItem[] = [];
    if (typeof WebAssembly !== "object") {
      return res;
    }
    if (WebAssembly.Module) {
      res.push(
        [ESM_BUILD_IN_OBJECT.WebAssembly_Module, WebAssembly.Module],
        [ESM_BUILD_IN_OBJECT.WebAssembly_Module_Prototype, WebAssembly.Module.prototype],
      );
    }
    if (WebAssembly.Instance) {
      res.push(
        [ESM_BUILD_IN_OBJECT.WebAssembly_Instance, WebAssembly.Instance],
        [ESM_BUILD_IN_OBJECT.WebAssembly_Instance_Prototype, WebAssembly.Instance.prototype],
      );
    }
    if (WebAssembly.Memory) {
      res.push(
        [ESM_BUILD_IN_OBJECT.WebAssembly_Memory, WebAssembly.Memory],
        [ESM_BUILD_IN_OBJECT.WebAssembly_Memory_Prototype, WebAssembly.Memory.prototype],
      );
    }
    if (WebAssembly.Table) {
      res.push(
        [ESM_BUILD_IN_OBJECT.WebAssembly_Table, WebAssembly.Table],
        [ESM_BUILD_IN_OBJECT.WebAssembly_Table_Prototype, WebAssembly.Table.prototype],
      );
    }
    if (WebAssembly.CompileError) {
      res.push(
        [ESM_BUILD_IN_OBJECT.WebAssembly_CompileError, WebAssembly.CompileError],
        [
          ESM_BUILD_IN_OBJECT.WebAssembly_CompileError_Prototype,
          WebAssembly.CompileError.prototype,
        ],
      );
    }
    if (WebAssembly.LinkError) {
      res.push(
        [ESM_BUILD_IN_OBJECT.WebAssembly_LinkError, WebAssembly.LinkError],
        [ESM_BUILD_IN_OBJECT.WebAssembly_LinkError_Prototype, WebAssembly.LinkError.prototype],
      );
    }
    if (WebAssembly.RuntimeError) {
      res.push(
        [ESM_BUILD_IN_OBJECT.WebAssembly_RuntimeError, WebAssembly.RuntimeError],
        [
          ESM_BUILD_IN_OBJECT.WebAssembly_RuntimeError_Prototype,
          WebAssembly.RuntimeError.prototype,
        ],
      );
    }

    return res;
  })(),

  /// arguments: 无
]);
export const EsmBuildInObject_KV = new Map(EsmBuildInObjectKeyValueList);
export const EsmBuildInObject_VK = new Map(
  EsmBuildInObjectKeyValueList.map((kv) => [kv[1], kv[0]]),
);
