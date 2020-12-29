/**
 * 不能使用instanceof，会触发Proxy的getPrototypeOf
 * @param obj
 */
const isObj = obj => {
  const targetType = typeof obj;
  return targetType === "object" && obj !== null || targetType === "function";
};

const checkUnregisterToken = unregisterToken => {
  if (!isObj(unregisterToken)) {
    throw new TypeError(`unregisterToken ('${unregisterToken}') must be an object`);
  }
};

const checkTarget = target => {
  if (!isObj(target)) {
    throw new TypeError("target must be an object");
  }
};

if (typeof WeakRef === "undefined") {
  const wr = new WeakMap();

  class WeakRef {
    constructor(target) {
      checkTarget(target);
      wr.set(this, target);
    }

    deref() {
      return wr.get(this);
    }

  }

  Object.defineProperty(globalThis, "WeakRef", {
    value: WeakRef
  }); ///
}

if (typeof FinalizationRegistry === "undefined") {
  if (typeof FinalizationGroup !== "undefined") {
    class FinalizationRegistry {
      constructor(cleanupCallback) {
        this.fg = new FinalizationGroup(heldValueIter => {
          for (const heldValue of heldValueIter) {
            cleanupCallback(heldValue);
          }
        });
      }

      register(target, heldValue, unregisterToken) {
        this.fg.register(target, heldValue, unregisterToken);
      }

      unregister(unregisterToken) {
        this.fg.unregister(unregisterToken);
      }

    }

    Object.defineProperty(globalThis, "FinalizationRegistry", {
      value: FinalizationRegistry
    });
  } else {
    class FinalizationRegistry {
      constructor(cleanupCallback) {}

      register(target, heldValue, unregisterToken) {
        checkTarget(target);

        if (unregisterToken !== undefined) {
          checkUnregisterToken(unregisterToken);
        }
      }

      unregister(unregisterToken) {
        checkUnregisterToken(unregisterToken);
      }

    }

    Object.defineProperty(globalThis, "FinalizationRegistry", {
      value: FinalizationRegistry
    });
  }
}

const ESM_REFLECT_FUN_MAP = new Map([[0
/* GetPrototypeOf */
, _SyncToCallback(target => Reflect.getPrototypeOf(target))], [1
/* SetPrototypeOf */
, _SyncToCallback((target, [proto]) => Reflect.setPrototypeOf(target, proto))], [2
/* IsExtensible */
, _SyncToCallback(target => Reflect.isExtensible(target))], [3
/* PreventExtensions */
, _SyncToCallback(target => Reflect.preventExtensions(target))], [4
/* GetOwnPropertyDescriptor */
, _SyncToCallback((target, [prop]) => Reflect.getOwnPropertyDescriptor(target, prop))], [5
/* Has */
, _SyncToCallback((target, [prop]) => Reflect.has(target, prop))], [6
/* Get */
, _SyncToCallback((target, [prop]) => Reflect.get(target, prop))], [7
/* Set */
, _SyncToCallback((target, [prop, value]) => Reflect.set(target, prop, value))], [8
/* DeleteProperty */
, _SyncToCallback((target, [prop]) => Reflect.deleteProperty(target, prop))], [9
/* DefineProperty */
, _SyncToCallback((target, [prop, attr]) => Reflect.defineProperty(target, prop, attr))], [10
/* OwnKeys */
, _SyncToCallback(target => Reflect.ownKeys(target))], [11
/* Apply */
, _SyncToCallback((target, [ctx, ...args]) => Reflect.apply(target, ctx, args))], [19
/* SyncApply */
, {
  type: "async",
  fun: (target, [ctx, ...args]) => Reflect.apply(target, ctx, args)
}], [20
/* AsyncApply */
, {
  type: "sync",
  fun: (target, [resolve, reject, ctx, ...args]) => queueMicrotask(async () => {
    try {
      const res = await Reflect.apply(target, ctx, args);
      resolve(res);
    } catch (err) {
      reject(err);
    }
  })
}], [12
/* Construct */
, _SyncToCallback((target, [newTarget, ...args]) => Reflect.construct(target, args, newTarget))], /// 运算符
[13
/* Asset */
, _SyncToCallback((target, [prop]) => target[prop])], [14
/* Typeof */
, _SyncToCallback(target => typeof target)], [15
/* Instanceof */
, _SyncToCallback((target, [ctor]) => target instanceof ctor)], [16
/* JsonStringify */
, _SyncToCallback(target => JSON.stringify(target))], [17
/* JsonParse */
, _SyncToCallback(target => JSON.parse(target))]]);

function _SyncToCallback(handler) {
  return {
    type: "sync",
    fun: handler
  };
}

const SyncForCallback = (cb, handler) => {
  try {
    cb({
      isError: false,
      data: handler()
    });
  } catch (error) {
    cb({
      isError: true,
      error
    });
  }
};
function resolveCallback(cb, data) {
  cb({
    isError: false,
    data
  });
}
function rejectCallback(cb, error) {
  cb({
    isError: true,
    error
  });
}
/**
 * 生成一个回调函数，通过指定的处理函数，最终传输给cb风格的出口
 * @param output
 * @param transformer
 */

const SyncPiperFactory = (output, transformer) => {
  return (...args) => {
    try {
      output({
        isError: false,
        data: transformer(...args)
      });
    } catch (error) {
      output({
        isError: true,
        error
      });
    }
  };
};
const OpenArg = arg => {
  if (arg.isError) {
    throw arg.error;
  }

  return arg.data;
}; // let _queueMicrotask: typeof queueMicrotask;
// if (typeof queueMicrotask === "function") {
//   /// globalThis和queueMicrotask是同个版本出现的
//   _queueMicrotask = queueMicrotask.bind(globalThis);
// } else {
//   const p = Promise.resolve();
//   _queueMicrotask = (cb) => {
//     p.then(cb as any).catch((err) => setTimeout(() => {}, 0));
//   };
// }

class ExportStore {
  constructor(name) {
    this.name = name;
    /**
     * 提供给远端的 refId|symId
     * 远端可以使用 locId 来进行访问本地
     */

    this.accId = 0;
    /**我所导出的引用对象与符号 */

    this.objIdStore = new Map();
  }

  getObjById(id) {
    const cache = this.objIdStore.get(id);

    if (cache && cache.type === 0
    /* Object */
    ) {
        return cache.obj;
      }
  }

  getSymById(id) {
    const cache = this.objIdStore.get(id);

    if (cache && cache.type === 1
    /* Symbol */
    ) {
        return cache.sym;
      }
  }

  getId(obj) {
    const cache = this.objIdStore.get(obj);
    return cache === null || cache === void 0 ? void 0 : cache.id;
  }
  /**
   * 保存对象的引用
   */


  saveObjId(obj, id = this.accId++) {
    const cache = {
      type: 0
      /* Object */
      ,
      obj,
      id
    };
    this.objIdStore.set(id, cache);
    this.objIdStore.set(obj, cache);
    return id;
  }
  /**
   * 保存符号
   */


  saveSymId(sym, id = this.accId++) {
    const cache = {
      type: 1
      /* Symbol */
      ,
      sym,
      id
    };
    this.objIdStore.set(id, cache);
    this.objIdStore.set(sym, cache);
    return id;
  }
  /**
   * 释放对象的引用
   * @param id
   */


  releaseById(id) {
    // console.log("release", this.name, id);
    const cache = this.objIdStore.get(id);

    if (cache) {
      if (cache.type === 0
      /* Object */
      ) {
          this.objIdStore.delete(cache.obj);
        } else {
        this.objIdStore.delete(cache.sym);
      }

      this.objIdStore.delete(id);
      return true;
    }

    return false;
  }

  exportSymbol(source) {
    var _a;

    return (_a = this.getId(source)) !== null && _a !== void 0 ? _a : this.saveSymId(source);
  }

  exportObject(source) {
    var _a;

    return (_a = this.getId(source)) !== null && _a !== void 0 ? _a : this.saveObjId(source);
  }

}

class ImportStore {
  constructor(name) {
    this.name = name;
    /**存储协议扩展信息 */

    this.idExtendsStore = new Map();
    /**我所导入的引用对象与符号 */

    this.proxyIdStore = new Map();
    this.proxyIdWM = new WeakMap();
    this._fr = new FinalizationRegistry(id => this.releaseProxyId(id));
  }
  /**
   * 获取代理对象背后真正的引用信息
   */


  getProxy(proxy) {
    let cache;

    switch (typeof proxy) {
      case "number":
      case "symbol":
        cache = this.proxyIdStore.get(proxy);
        break;

      case "object":
        if (proxy === null) {
          return;
        }

      case "function":
        const id = this.proxyIdWM.get(proxy);

        if (id !== undefined) {
          cache = this.proxyIdStore.get(id);
        }

        break;
    }

    return cache;
  }

  isProxy(proxy) {
    switch (typeof proxy) {
      case "symbol":
        return this.proxyIdStore.has(proxy);

      case "object":
        if (proxy === null) {
          return false;
        }

      case "function":
        return this.proxyIdWM.has(proxy);
    }

    return false;
  }

  getProxyById(id) {
    const cache = this.proxyIdStore.get(id);
    let res;

    if (cache) {
      if (cache.type === 0
      /* Proxy */
      ) {
          res = cache.pwr.deref();
        } else {
        res = cache.sym;
      }
    }

    return res;
  }
  /**
   * 保存导入引用
   * @param proxy Proxy<object>|remote-symbol-placeholder
   * @param id refId
   */


  saveProxyId(proxy, id) {
    let cache;

    if (typeof proxy === "symbol") {
      cache = {
        id,
        type: 1
        /* Symbol */
        ,
        sym: proxy
      };
      this.proxyIdStore.set(proxy, cache);
    } else {
      cache = {
        id,
        type: 0
        /* Proxy */
        ,
        pwr: new WeakRef(proxy)
      };

      this._fr.register(proxy, id, cache.pwr);

      this.proxyIdWM.set(proxy, id);
    }

    this.proxyIdStore.set(id, cache);
  }
  /**为某一个对象记录 refId */


  backupProxyId(proxy, id) {
    this.proxyIdWM.set(proxy, id);
  }
  /**
   * 释放导入的引用
   * @param id refId
   */


  releaseProxyId(id) {
    // console.log("release", this.name, id);
    const cache = this.proxyIdStore.get(id);

    if (cache) {
      this.proxyIdStore.delete(id);

      if (cache.type === 1
      /* Symbol */
      ) {
          this.proxyIdStore.delete(cache.sym);
        } else {
        //   this.proxyIdWM.delete(cache.)
        this._fr.unregister(cache.pwr);
      } // 删除缓存的扩展信息


      this.idExtendsStore.delete(id);

      this._onReleaseCallback(id);

      return true;
    }

    return false;
  }

  _onReleaseCallback(id) {
    return;
  }
  /**监听一个引用被释放 */


  onRelease(cb) {
    this._onReleaseCallback = cb;
  }

} // export const importStore = new ImportStore();

class ComlinkCore {
  constructor(port, name) {
    this.port = port;
    this.name = name;
    this.exportStore = new ExportStore(this.name);
    this.importStore = new ImportStore(this.name);
    /**用于存储导出的域 */

    this._exportModule = {
      scope: Object.create(null),
      isExported: false
    };

    this._listen();
  }

  $destroy() {
    throw new Error("Method not implemented.");
  }

  _getInitedExportScope() {
    const {
      _exportModule
    } = this;

    if (_exportModule.isExported === false) {
      _exportModule.isExported = true;
      this.exportStore.exportObject(_exportModule.scope);
    }

    return _exportModule.scope;
  }

  export(source, name = "default") {
    Reflect.set(this._getInitedExportScope(), name, source);
  }

  $getEsmReflectHanlder(operator) {
    const handler = ESM_REFLECT_FUN_MAP.get(operator);

    if (!handler) {
      throw new SyntaxError("no support operator:" + operator);
    }

    return handler;
  }

  _listen() {
    var _this = this;

    const {
      exportStore: exportStore,
      port
    } = this;
    port.onMessage(async function (cb, bin) {
      const out_void = () => resolveCallback(cb, undefined);

      const linkObj = _this.transfer.transferableBinary2LinkObj(bin);

      if (linkObj.type === 2
      /* In */
      ) {
          const obj = exportStore.getObjById(linkObj.targetId);

          if (obj === undefined) {
            throw new ReferenceError("no found");
          }
          /**预备好结果 */


          const linkOut = {
            type: 3
            /* Out */
            ,
            // resId: linkObj.reqId,
            out: [],
            isThrow: false
          };

          const out_linkOut = anyRes => {
            _this.transfer.Any2InOutBinary(iobRet => {
              if (iobRet.isError) {
                return cb(iobRet);
              }

              linkOut.out.push(iobRet.data);
              resolveCallback(cb, _this.transfer.linkObj2TransferableBinary(linkOut));
            }, anyRes);
          };

          try {
            let res;
            /**JS语言中，this对象不用传输。
             * 但在Comlink协议中，它必须传输：
             * 因为我们使用call/apply模拟，所以所有所需的对象都需要传递进来
             */

            const operator = _this.transfer.InOutBinary2Any(linkObj.in[0]);

            const paramList = linkObj.in.slice(1).map(iob => _this.transfer.InOutBinary2Any(iob));

            if (18
            /* Multi */
            === operator) {
              /// 批量操作
              res = obj;

              for (let i = 0; i < paramList.length;) {
                const len = paramList[i];
                const $operator = paramList[i + 1];
                const $paramList = paramList.slice(i + 2, i + 1 + len);

                const $handler = _this.$getEsmReflectHanlder($operator);

                res = $handler.fun(res, $paramList);

                if ($handler.type === "async") {
                  res = await res;
                }

                i += len + 1;
              }
            } else {
              /// 单项操作
              const handler = _this.$getEsmReflectHanlder(operator);

              res = handler.fun(obj, paramList);

              if (handler.type === "async") {
                res = await res;
              }
            } /// 如果有返回结果的需要，那么就尝试进行返回


            if (linkObj.hasOut) {
              return out_linkOut(res);
            } else {
              return out_void();
            }
          } catch (err) {
            linkOut.isThrow = true;
            return out_linkOut(err);
          }
        } else if (linkObj.type === 0
      /* Import */
      ) {
          const scope = _this._getInitedExportScope();

          return _this.transfer.Any2InOutBinary(scopeRet => {
            if (scopeRet.isError) {
              return cb(scopeRet);
            }

            resolveCallback(cb, _this.transfer.linkObj2TransferableBinary({
              type: 1
              /* Export */
              ,
              module: scopeRet.data
            }));
          }, scope);
        } else if (linkObj.type === 4
      /* Release */
      ) {
          exportStore.releaseById(linkObj.locId);
        }

      out_void();
    });
    this.importStore.onRelease(refId => {
      // console.log("send release", refId);
      port.send(this.transfer.linkObj2TransferableBinary({
        type: 4
        /* Release */
        ,
        locId: refId
      }));
    });
  }

  $getImportModule(output) {
    const {
      port
    } = this;
    /**
     * 进行协商握手，取得对应的 refId
     * @TODO 这里将会扩展出各类语言的传输协议
     */

    if (this._importModule === undefined) {
      port.req(SyncPiperFactory(output, ret => {
        const bin = OpenArg(ret);
        const linkObj = this.transfer.transferableBinary2LinkObj(bin);

        if (linkObj.type !== 1
        /* Export */
        ) {
            throw new TypeError();
          } /// 握手完成，转成代理对象


        return this._importModule = this.transfer.InOutBinary2Any(linkObj.module);
      }), this.transfer.linkObj2TransferableBinary({
        type: 0
        /* Import */

      }));
      return;
    }

    output({
      isError: false,
      data: this._importModule
    });
  }

}

const IOB_EFT_Factory_Map = new Map([[2
/* Sync */
, {
  factory: Function,
  toString: refExtends => `function ${refExtends.name}() { [remote code] }`
}]]);

for (const [funType, {
  factoryCode,
  toString
}] of [[3
/* SyncGenerator */
, {
  factoryCode: "return function* () {}.constructor",
  toString: refExtends => `function *${refExtends.name}() { [remote code] }`
}], [4
/* Async */
, {
  factoryCode: "return async function () {}.constructor",
  toString: refExtends => `async function ${refExtends.name}() { [remote code] }`
}], [5
/* AsyncGenerator */
, {
  factoryCode: "return async function* () {}.constructor",
  toString: refExtends => `async function *${refExtends.name}() { [remote code] }`
}], [8
/* Class */
, {
  factoryCode: "return ()=>class {}",
  toString: refExtends => `class ${refExtends.name} { [remote code] }`
}]]) {
  let factory;

  try {
    factory = Function(factoryCode)();
  } catch (_unused) {
    factory = Function;
  }

  IOB_EFT_Factory_Map.set(funType, {
    factory,
    toString
  });
}

function getFunctionType(fun) {
  const ctor = fun.constructor;

  if (ctor) {
    const ctorName = ctor.name;

    if (ctorName === "AsyncGeneratorFunction") {
      return 5
      /* AsyncGenerator */
      ;
    }

    if (ctorName === "AsyncFunction") {
      return 4
      /* Async */
      ;
    }

    if (ctorName === "GeneratorFunction") {
      return 3
      /* SyncGenerator */
      ;
    }
  }

  const str = Object.toString.call(fun);

  if (str.startsWith("class")) {
    return 8
    /* Class */
    ;
  }

  return 2
  /* Sync */
  ;
}
/**导出者 用于描述一个 function 的导出配置 */

const EXPORT_FUN_DESCRIPTOR_SYMBOL = Symbol("function.export");
/**获取一个对象的描述信息 */

function getFunctionExportDescription(fun) {
  return Reflect.get(fun, EXPORT_FUN_DESCRIPTOR_SYMBOL) || {};
}
/**导入者 缓存一个 function 的导入信息 */

const IMPORT_FUN_EXTENDS_SYMBOL = Symbol("function.import");
/**
 * 用于替代 RefFunction 的 Function.property.toString
 * @param this
 */

function refFunctionStaticToStringFactory() {
  function toString() {
    if (this === self) {
      /**模拟远端获取到的 */
      return "function toString() { [remote code] }";
    }

    const refExtends = Reflect.get(this, IMPORT_FUN_EXTENDS_SYMBOL);
    const {
      toString
    } = refExtends;

    if (toString.mode === 1
    /* static */
    ) {
        return toString.code;
      }

    throw new TypeError();
  }

  const self = toString;
  /**对自我进行源码保护 */

  Object.defineProperty(self, "toString", {
    configurable: false,
    writable: false,
    value: self
  });
  return toString;
}
function getObjectStatus(obj) {
  if (Object.isFrozen(obj)) {
    return 0
    /* frozen */
    ;
  }

  if (Object.isSealed(obj)) {
    return 2
    /* sealed */
    ;
  }

  if (Object.isExtensible(obj)) {
    return 3
    /* preventedExtensions */
    ;
  }

  return 7
  /* freedom */
  ;
} //#endregion
//#region IOB_Extends::Symbol

const globalSymbolStore = new Map();
["asyncIterator", "hasInstance", "isConcatSpreadable", "iterator", "match", "matchAll", "replace", "search", "species", "split", "toPrimitive", "toStringTag", "unscopables"].forEach(name => {
  const sym = Reflect.get(Symbol, name);

  if (typeof sym === "symbol") {
    const cache = {
      sym,
      name
    };
    globalSymbolStore.set(sym, cache);
    globalSymbolStore.set(name, cache);
  }
}); //#endregion

class ModelTransfer {
  constructor(core) {
    this.core = core;
  }

  canClone(obj) {
    switch (typeof obj) {
      case "bigint":
      case "boolean":
      case "number":
      case "string":
      case "undefined":
        return true;

      case "symbol": // return Symbol.keyFor(obj) !== undefined;

      case "function":
        return false;

      case "object":
        return obj === null;
    }

    return false;
  }
  /**获取符号的扩展信息 */


  _getRemoteSymbolItemExtends(sym) {
    var _a, _b;

    const globalSymInfo = globalSymbolStore.get(sym);

    if (globalSymInfo) {
      return {
        type: 2
        /* Symbol */
        ,
        global: true,
        description: globalSymInfo.name,
        unique: false
      };
    }

    return {
      type: 2
      /* Symbol */
      ,
      global: false,
      description: (_b = (_a = Object.getOwnPropertyDescriptor(sym, "description")) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : sym.toString().slice(7, -1),
      unique: Symbol.keyFor(sym) !== undefined
    };
  }
  /**获取一个引用对象的扩展信息 */


  _getRefItemExtends(obj) {
    if (typeof obj === "object") {
      return {
        type: 1
        /* Object */
        ,
        status: getObjectStatus(obj)
      };
    }

    if (typeof obj === "function") {
      const exportDescriptor = getFunctionExportDescription(obj);
      const funType = getFunctionType(obj);
      /**
       * @FIXME 这种判断也是有风险的，因为虽然箭头函数等严格模式不允许执行 `fun.caller = 1`，但因为`caller`并不在属性里，而是在原型链上进行约束的，所以可能会使用`Reflect.set(fun,'caller',1)`从而达成混淆的效果
       */

      const isStatic = Object.getOwnPropertyDescriptor(obj, "caller") === undefined;
      return {
        type: 0
        /* Function */
        ,
        funType,
        name: obj.name,
        length: obj.length,
        isStatic,
        status: getObjectStatus(obj),
        instanceOfFunction: obj instanceof Function,
        canConstruct: funType === 8
        /* Class */
        || funType === 2
        /* Sync */
        && isStatic === false,
        toString: obj.toString === Function.prototype.toString ? {
          mode: 1
          /* static */
          ,
          code: exportDescriptor.showSourceCode ? obj.toString() : IOB_EFT_Factory_Map.get(funType).toString(obj)
        } : {
          mode: 0
          /* dynamic */

        }
      };
    }

    throw new TypeError();
  }

  Any2InOutBinary(cb, obj) {
    SyncForCallback(cb, () => {
      const needClone = this.canClone(obj);
      let item; /// 可直接通过赋值而克隆的对象

      if (needClone) {
        item = {
          type: 0
          /* Clone */
          ,
          data: obj
        };
      } else {
        /// 对象是否是导入进来的
        const imp = this.core.importStore.getProxy(obj);

        if (imp) {
          item = {
            type: 3
            /* Locale */
            ,
            locId: imp.id
          };
        } /// 符号对象需要在远端做一个克隆备份
        else {
            switch (typeof obj) {
              case "symbol":
                item = {
                  type: 1
                  /* RemoteSymbol */
                  ,
                  refId: this.core.exportStore.exportSymbol(obj),
                  extends: this._getRemoteSymbolItemExtends(obj)
                };
                break;

              case "function":
              case "object":
                if (obj !== null) {
                  item = {
                    type: 2
                    /* Ref */
                    ,
                    refId: this.core.exportStore.exportObject(obj),
                    extends: this._getRefItemExtends(obj)
                  };
                }

            }
          }
      }

      if (!item) {
        throw new TypeError("Cloud not transfer to IOB");
      }

      return item;
    });
  }

  linkObj2TransferableBinary(obj) {
    return obj;
  }

  transferableBinary2LinkObj(bin) {
    return bin;
  }

}

const CB_TO_SYNC_ERROR = new SyntaxError("could not transfrom to sync function");
function CallbackToSync(cbCaller, args, ctx) {
  let ret = {
    isError: true,
    error: CB_TO_SYNC_ERROR
  };
  cbCaller.call(ctx, _ret => ret = _ret, ...args);
  return OpenArg(ret);
}

const IS_ASYNC_APPLY_FUN_MARKER = Symbol("asyncApplyFun");
const IS_SYNC_APPLY_FUN_MARKER = Symbol("syncApplyFun");
const PROTOCAL_SENDER = Symbol("protocalSender");

function _asyncIterator(iterable) {
  var method;

  if (typeof Symbol !== "undefined") {
    if (Symbol.asyncIterator) {
      method = iterable[Symbol.asyncIterator];
      if (method != null) return method.call(iterable);
    }

    if (Symbol.iterator) {
      method = iterable[Symbol.iterator];
      if (method != null) return method.call(iterable);
    }
  }

  throw new TypeError("Object is not async iterable");
}

function _AwaitValue(value) {
  this.wrapped = value;
}

function _AsyncGenerator(gen) {
  var front, back;

  function send(key, arg) {
    return new Promise(function (resolve, reject) {
      var request = {
        key: key,
        arg: arg,
        resolve: resolve,
        reject: reject,
        next: null
      };

      if (back) {
        back = back.next = request;
      } else {
        front = back = request;
        resume(key, arg);
      }
    });
  }

  function resume(key, arg) {
    try {
      var result = gen[key](arg);
      var value = result.value;
      var wrappedAwait = value instanceof _AwaitValue;
      Promise.resolve(wrappedAwait ? value.wrapped : value).then(function (arg) {
        if (wrappedAwait) {
          resume(key === "return" ? "return" : "next", arg);
          return;
        }

        settle(result.done ? "return" : "normal", arg);
      }, function (err) {
        resume("throw", err);
      });
    } catch (err) {
      settle("throw", err);
    }
  }

  function settle(type, value) {
    switch (type) {
      case "return":
        front.resolve({
          value: value,
          done: true
        });
        break;

      case "throw":
        front.reject(value);
        break;

      default:
        front.resolve({
          value: value,
          done: false
        });
        break;
    }

    front = front.next;

    if (front) {
      resume(front.key, front.arg);
    } else {
      back = null;
    }
  }

  this._invoke = send;

  if (typeof gen.return !== "function") {
    this.return = undefined;
  }
}

if (typeof Symbol === "function" && Symbol.asyncIterator) {
  _AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
    return this;
  };
}

_AsyncGenerator.prototype.next = function (arg) {
  return this._invoke("next", arg);
};

_AsyncGenerator.prototype.throw = function (arg) {
  return this._invoke("throw", arg);
};

_AsyncGenerator.prototype.return = function (arg) {
  return this._invoke("return", arg);
};

function _wrapAsyncGenerator(fn) {
  return function () {
    return new _AsyncGenerator(fn.apply(this, arguments));
  };
}

function _awaitAsyncGenerator(value) {
  return new _AwaitValue(value);
}

function _asyncGeneratorDelegate(inner, awaitWrap) {
  var iter = {},
      waiting = false;

  function pump(key, value) {
    waiting = true;
    value = new Promise(function (resolve) {
      resolve(inner[key](value));
    });
    return {
      done: false,
      value: awaitWrap(value)
    };
  }

  if (typeof Symbol === "function" && Symbol.iterator) {
    iter[Symbol.iterator] = function () {
      return this;
    };
  }

  iter.next = function (value) {
    if (waiting) {
      waiting = false;
      return value;
    }

    return pump("next", value);
  };

  if (typeof inner.throw === "function") {
    iter.throw = function (value) {
      if (waiting) {
        waiting = false;
        throw value;
      }

      return pump("throw", value);
    };
  }

  if (typeof inner.return === "function") {
    iter.return = function (value) {
      if (waiting) {
        waiting = false;
        return value;
      }

      return pump("return", value);
    };
  }

  return iter;
}

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

const SENDER_MARKER = Symbol("linkInSender");
class SyncModelTransfer extends ModelTransfer {
  constructor(core) {
    super(core);
    /**
     * ref fun statis toString
     */

    this._rfsts = refFunctionStaticToStringFactory();
  }

  _genLinkInSender(port, refId) {
    const req = linkIn => this._reqLinkIn(port, refId, linkIn);

    const send = linkIn => this._sendLinkIn(port, refId, linkIn);

    return {
      __marker__: SENDER_MARKER,
      send,
      req
    };
  }

  _getDefaultProxyHanlder(sender) {
    const proxyHandler = {
      getPrototypeOf: _target => sender.req([0
      /* GetPrototypeOf */
      ]),
      setPrototypeOf: (_target, proto) => sender.req([1
      /* SetPrototypeOf */
      , proto]),
      isExtensible: target => sender.req([2
      /* IsExtensible */
      ]),
      preventExtensions: _target => sender.req([3
      /* PreventExtensions */
      ]),
      getOwnPropertyDescriptor: (_target, prop) => sender.req([4
      /* GetOwnPropertyDescriptor */
      , prop]),
      has: (_target, prop) => sender.req([5
      /* Has */
      ]),

      /**导入子模块 */
      get: (_target, prop, _reciver) => // console.log("get", prop),
      sender.req([6
      /* Get */
      , prop]),

      /**发送 set 操作 */
      set: (_target, prop, value, _receiver) => sender.req([7
      /* Set */
      , prop, value]),
      deleteProperty: (_target, prop) => sender.req([8
      /* DeleteProperty */
      , prop]),
      defineProperty: (_target, prop, attr) => sender.req([9
      /* DefineProperty */
      , prop, attr]),
      ownKeys: _target => sender.req([10
      /* OwnKeys */
      ]),
      apply: (_target, thisArg, argArray) => sender.req([11
      /* Apply */
      , thisArg, ...argArray]),
      construct: (_target, argArray, newTarget) => sender.req([12
      /* Construct */
      , newTarget, ...argArray])
    };
    return proxyHandler;
  }
  /**打包指令 */


  _pkgLinkIn(targetId, linkIn, hasOut) {
    const {
      transfer
    } = this.core;
    return transfer.linkObj2TransferableBinary({
      type: 2
      /* In */
      ,
      // reqId,
      targetId,
      in: linkIn.map(a => CallbackToSync(transfer.Any2InOutBinary, [a], transfer)),
      hasOut
    });
  }

  _reqLinkIn(port, targetId, linkIn) {
    const {
      transfer
    } = this.core;

    const tb = this._pkgLinkIn(targetId, linkIn, true); /// 执行请求


    const bin = CallbackToSync(port.req, [tb], port); /// 处理请求

    const linkObj = transfer.transferableBinary2LinkObj(bin);

    if (linkObj.type !== 3
    /* Out */
    ) {
        throw new TypeError();
      }

    if (linkObj.isThrow) {
      const err_iob = linkObj.out.slice().pop();
      const err = err_iob && transfer.InOutBinary2Any(err_iob);
      throw err;
    }

    const res_iob = linkObj.out.slice().pop();
    const res = res_iob && transfer.InOutBinary2Any(res_iob);
    return res;
  }

  _sendLinkIn(port, targetId, linkIn) {
    const {
      transfer
    } = this.core;
    const tb = transfer.linkObj2TransferableBinary({
      type: 2
      /* In */
      ,
      // reqId,
      targetId,
      in: linkIn.map(a => CallbackToSync(transfer.Any2InOutBinary, [a], transfer)),
      hasOut: false
    });
    port.send(tb);
  }
  /**
   * 主动生成引用代理
   * @param port
   * @param refId
   */


  _createImportByRefId(port, refId) {
    const refHook = this._createImportRefHook(port, refId);

    const source = refHook.getSource();

    if (refHook.type === "object") {
      const proxyHanlder = refHook.getProxyHanlder();
      const proxy = new Proxy(source, proxyHanlder);
      return proxy;
    }

    return source;
  }

  getLinkInSenderByProxy(obj) {
    if (obj) {
      const sender = obj[PROTOCAL_SENDER];

      if (sender.__marker__ === SENDER_MARKER) {
        return sender;
      }
    }
  }

  _createImportRefHook(port, refId) {
    const refExtends = this.core.importStore.idExtendsStore.get(refId);

    if (!refExtends) {
      throw new ReferenceError();
    }

    let ref;

    if (refExtends.type === 0
    /* Function */
    ) {
        const factory = IOB_EFT_Factory_Map.get(refExtends.funType);

        if (!factory) {
          throw new TypeError();
        }

        const sourceFun = factory.factory();
        const funRef = {
          type: "object",
          getSource: () => sourceFun,
          getProxyHanlder: () => {
            const sender = this._genLinkInSender(port, refId);

            const defaultProxyHanlder = this._getDefaultProxyHanlder(sender);

            const functionProxyHanlder = _extends({}, defaultProxyHanlder, {
              get: (target, prop, receiver) => {
                if (prop === "name") {
                  return refExtends.name;
                }

                if (prop === "length") {
                  return refExtends.length;
                } //#region 自定义属性


                if (prop === IMPORT_FUN_EXTENDS_SYMBOL) {
                  return refExtends;
                }

                if (prop === PROTOCAL_SENDER) {
                  return sender;
                } //#endregion
                //#region 静态的toString模式下的本地模拟

                /**
                 * 本地模拟的toString，constructor和protoype等等属性都没有绑定远程
                 * 这里纯粹是为了加速，模拟远端的返回，可以不用
                 * @TODO 配置成可以可选模式
                 */


                if (prop === "toString" && refExtends.toString.mode === 1
                /* static */
                ) {
                    return this._rfsts;
                  } //#endregion


                return defaultProxyHanlder.get(target, prop, receiver);
              }
            });

            return functionProxyHanlder;
          }
        };
        ref = funRef;
      } else if (refExtends.type === 1
    /* Object */
    ) {
        const sourceObj = {};
        const objRef = {
          type: "object",
          getSource: () => sourceObj,
          getProxyHanlder: () => {
            const sender = this._genLinkInSender(port, refId);

            const defaultProxyHanlder = this._getDefaultProxyHanlder(sender);
            /**
             * 因为对象一旦被设置状态后，无法回退，所以这里可以直接根据现有的状态来判断对象的可操作性
             * @TODO 使用isExtensible isFrozen isSealed来改进
             */


            const functionProxyHanlder = _extends({}, defaultProxyHanlder, {
              get: (target, prop, receiver) => {
                //#region 自定义属性
                if (prop === PROTOCAL_SENDER) {
                  return sender;
                } //#endregion


                return defaultProxyHanlder.get(target, prop, receiver);
              },

              set(target, prop, value, receiver) {
                /**目前如果要实现判断是insert还是update，就要基于已经知道有多少的属性来推断，这方面还需要考虑 ArrayLike 的优化
                 * 这一切可能要做成缓存的模式，缓存被禁止的属性
                 * @TODO 如果是 不能add 当 可以update 的模式，就要收集哪些是不能add的，之后就要直接在本地禁止
                 */
                if ((refExtends.status & 2
                /* update */
                ) === 0) {
                  return false;
                }

                return defaultProxyHanlder.set(target, prop, value, receiver);
              },

              deleteProperty(target, prop) {
                if ((refExtends.status & 4
                /* delete */
                ) !== 0) {
                  return defaultProxyHanlder.deleteProperty(target, prop);
                }

                return false;
              }

            });

            return functionProxyHanlder;
          }
        };
        ref = objRef;
      } else if (refExtends.type === 2
    /* Symbol */
    ) {
        let sourceSym;

        if (refExtends.global) {
          const globalSymInfo = globalSymbolStore.get(refExtends.description);

          if (!globalSymInfo) {
            throw new TypeError();
          }

          sourceSym = globalSymInfo.sym;
        } else {
          sourceSym = refExtends.unique ? Symbol.for(refExtends.description) : Symbol(refExtends.description);
        }

        const symRef = {
          type: "primitive",
          getSource: () => sourceSym
        };
        ref = symRef;
      }

    if (!ref) {
      throw new TypeError();
    }

    return ref;
  }

  InOutBinary2Any(bin) {
    const {
      port,
      importStore,
      exportStore
    } = this.core;

    switch (bin.type) {
      //   case LinkItemType.Default:
      //     return defaultCtx;
      case 3
      /* Locale */
      :
        const loc = exportStore.getObjById(bin.locId) || exportStore.getSymById(bin.locId);

        if (!loc) {
          throw new ReferenceError();
        }

        return loc;

      case 2
      /* Ref */
      :
      case 1
      /* RemoteSymbol */
      :
        /// 读取缓存中的应用对象
        let cachedProxy = importStore.getProxyById(bin.refId);

        if (cachedProxy === undefined) {
          // 保存引用信息
          importStore.idExtendsStore.set(bin.refId, bin.extends); /// 使用导入功能生成对象

          cachedProxy = this._createImportByRefId(port, bin.refId); /// 缓存对象

          importStore.saveProxyId(cachedProxy, bin.refId);
        }

        return cachedProxy;

      case 0
      /* Clone */
      :
        return bin.data;
    }

    throw new TypeError();
  }

}

class ComlinkSync extends ComlinkCore {
  constructor(port, name) {
    super(port, name);
    this.transfer = new SyncModelTransfer(this);
    this._syncWM = new WeakMap();
    this._asyncWM = new WeakMap();
  } // /**
  //  * ref fun statis toString
  //  */
  // private _rfsts = refFunctionStaticToStringFactory();


  $getEsmReflectHanlder(opeartor) {
    const hanlder = super.$getEsmReflectHanlder(opeartor);

    if (opeartor === 11
    /* Apply */
    || opeartor === 19
    /* SyncApply */
    ) {
        const applyHanlder = (target, args) => {
          if (target === Function.prototype.toString) {
            const ctx = args[0];
            const exportDescriptor = getFunctionExportDescription(ctx); /// 保护源码

            if (!exportDescriptor.showSourceCode) {
              // console.log("get to string from remote");
              return IOB_EFT_Factory_Map.get(getFunctionType(ctx)).toString({
                name: ctx.name
              });
            }
          }

          return hanlder.fun(target, args);
        };

        return {
          type: hanlder.type,
          fun: applyHanlder
        };
      }

    return hanlder;
  }

  import(key = "default") {
    const importModule = CallbackToSync(this.$getImportModule, [], this);
    return Reflect.get(importModule, key);
  }

  importAsSync(key = "default") {
    return this.asyncToSync(this.import(key));
  }

  asyncToSync(fun) {
    if (typeof fun !== "function") {
      throw new TypeError();
    }

    if (Reflect.get(fun, IS_ASYNC_APPLY_FUN_MARKER)) {
      return fun;
    }

    let syncFun = this._syncWM.get(fun);

    if (!syncFun) {
      const sender = this.transfer.getLinkInSenderByProxy(fun);

      if (!sender) {
        throw new TypeError();
      }

      syncFun = new Proxy(fun, {
        get(_target, prop, r) {
          if (prop === IS_ASYNC_APPLY_FUN_MARKER) {
            return true;
          }

          return Reflect.get(fun, prop, r);
        },

        apply: (_target, thisArg, argArray) => {
          return sender.req([19
          /* SyncApply */
          , thisArg, ...argArray]);
        }
      });
      this.importStore.backupProxyId(syncFun, this.importStore.getProxy(fun).id);

      this._syncWM.set(fun, syncFun);
    }

    return syncFun;
  }

  importAsAsync(key = "default") {
    return this.syncToAsync(this.import(key));
  }

  syncToAsync(fun) {
    if (typeof fun !== "function") {
      throw new TypeError();
    }

    if (Reflect.get(fun, IS_SYNC_APPLY_FUN_MARKER)) {
      return fun;
    }

    let asyncFun = this._asyncWM.get(fun);

    if (!asyncFun) {
      const sender = this.transfer.getLinkInSenderByProxy(fun);

      if (!sender) {
        throw new TypeError();
      }

      asyncFun = new Proxy(fun, {
        get(_target, prop, r) {
          if (prop === IS_SYNC_APPLY_FUN_MARKER) {
            return true;
          }

          return Reflect.get(fun, prop, r);
        },

        apply: (_target, thisArg, argArray) => {
          /// 要使用本地的promise对任务进行包裹，不然对方接下来会进入卡死状态。
          return new Promise((resolve, reject) => {
            /* 无需返回值，所以走 .send ，这个是异步的，不会造成阻塞 */
            sender.send([20
            /* AsyncApply */
            , resolve, reject, thisArg, ...argArray]);
          });
        }
      });
      this.importStore.backupProxyId(asyncFun, this.importStore.getProxy(fun).id);

      this._asyncWM.set(fun, asyncFun);
    }

    return asyncFun;
  }

}

function bindThis(target, propertyKey, descriptor) {
  if (!descriptor || typeof descriptor.value !== "function") {
    throw new TypeError(`Only methods can be decorated with @bind. <${propertyKey}> is not a method!`);
  }

  return {
    configurable: true,

    get() {
      const bound = descriptor.value.bind(this);
      Object.defineProperty(this, propertyKey, {
        value: bound,
        configurable: true,
        writable: true
      });
      return bound;
    }

  };
}

const CACHE_KEYS_SYMBOL = Symbol("CACHE_GETTER_KEYS_STORE");

function getCacheKeys(protoTarget) {
  let CACHE_KEYS = Reflect.get(protoTarget, CACHE_KEYS_SYMBOL);

  if (!CACHE_KEYS) {
    CACHE_KEYS = new Map();
    Reflect.set(protoTarget, CACHE_KEYS_SYMBOL, CACHE_KEYS);
  }

  return CACHE_KEYS;
}

function keyGenerator(protoTarget, prop) {
  const CACHE_KEYS = getCacheKeys(protoTarget);
  let symbol = CACHE_KEYS.get(prop);

  if (!symbol) {
    symbol = Symbol(`[${typeof prop}]${String(prop)}`);
    CACHE_KEYS.set(prop, symbol);
  }

  return symbol;
}

function cacheGetter(propTarget, prop, descriptor) {
  if (typeof descriptor.get !== "function") {
    throw new TypeError(`property ${String(prop)} must has an getter function.`);
  }

  const source_fun = descriptor.get;
  const CACHE_VALUE_SYMBOL = keyGenerator(propTarget, prop);

  const getter = function getter() {
    if (CACHE_VALUE_SYMBOL in this) {
      return this[CACHE_VALUE_SYMBOL].value;
    } else {
      const value = source_fun.call(this);
      const cacheValue = {
        target: this,
        value,
        sourceFun: source_fun
      };
      this[CACHE_VALUE_SYMBOL] = cacheValue;

      if (descriptor.set === undefined) {
        try {
          Object.defineProperty(this, prop, {
            value,
            writable: false,
            configurable: true,
            enumerable: descriptor.enumerable
          });
        } catch (err) {
          console.error(err);
        }
      }

      return value;
    }
  };

  Reflect.set(getter, "source_fun", source_fun);
  descriptor.get = getter;
  return descriptor;
}
function cleanGetterCache(target, prop) {
  const CACHE_KEYS = getCacheKeys(target);

  if (CACHE_KEYS.has(prop) === false) {
    return true;
  }

  const CACHE_VALUE_SYMBOL = CACHE_KEYS.get(prop);
  return _cleanGetterCache(target, prop, CACHE_VALUE_SYMBOL);
}
function cleanAllGetterCache(target) {
  const CACHE_KEYS = getCacheKeys(target);

  for (const [prop, symbol] of CACHE_KEYS) {
    _cleanGetterCache(target, prop, symbol);
  }
}

function _cleanGetterCache(target, prop, CACHE_VALUE_SYMBOL) {
  const cacheValue = Reflect.get(target, CACHE_VALUE_SYMBOL);

  if (cacheValue === undefined) {
    return true;
  }

  if (Reflect.deleteProperty(cacheValue.target, CACHE_VALUE_SYMBOL) === false) {
    return false;
  }

  Reflect.deleteProperty(cacheValue.target, prop);
  return true;
}

var __decorate = undefined && undefined.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
      r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
      d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};

var __metadata = undefined && undefined.__metadata || function (k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
class PropArrayHelper {
  constructor(pid = Math.random().toString(36).substr(2)) {
    this.pid = pid;
    this.CLASS_PROTO_ARRAYDATA_POOL = new Map();
    this.PA_ID_KEY = Symbol(`@PAID:${this.pid}`);
    this.PA_ID_VALUE = 0;
  }

  get(target, key) {
    var res = new Set();
    const CLASS_PROTO_ARRAYDATA = this.CLASS_PROTO_ARRAYDATA_POOL.get(key);

    if (CLASS_PROTO_ARRAYDATA) {
      do {
        if (target.hasOwnProperty(this.PA_ID_KEY)) {
          const arr_data = CLASS_PROTO_ARRAYDATA.get(target[this.PA_ID_KEY]);

          if (arr_data) {
            for (var item of arr_data) {
              res.add(item);
            }
          }
        }
      } while (target = Object.getPrototypeOf(target));
    }

    return res;
  }

  add(target, key, value) {
    var CLASS_PROTO_ARRAYDATA = this.CLASS_PROTO_ARRAYDATA_POOL.get(key);

    if (!CLASS_PROTO_ARRAYDATA) {
      CLASS_PROTO_ARRAYDATA = new Map();
      this.CLASS_PROTO_ARRAYDATA_POOL.set(key, CLASS_PROTO_ARRAYDATA);
    }

    const pa_id = target.hasOwnProperty(this.PA_ID_KEY) ? target[this.PA_ID_KEY] : target[this.PA_ID_KEY] = Symbol(`@PAID:${this.pid}#${this.PA_ID_VALUE++}`);
    var arr_data = CLASS_PROTO_ARRAYDATA.get(pa_id);

    if (!arr_data) {
      arr_data = [value];
      CLASS_PROTO_ARRAYDATA.set(pa_id, arr_data);
    } else {
      arr_data.push(value);
    }
  }

  remove(target, key, value) {
    const CLASS_PROTO_ARRAYDATA = this.CLASS_PROTO_ARRAYDATA_POOL.get(key);

    if (!CLASS_PROTO_ARRAYDATA) {
      return;
    }

    do {
      if (!target.hasOwnProperty(this.PA_ID_KEY)) {
        break;
      }

      const pa_id = target[this.PA_ID_KEY];
      var arr_data = CLASS_PROTO_ARRAYDATA.get(pa_id);

      if (!arr_data) {
        return;
      }

      const index = arr_data.indexOf(value);

      if (index !== -1) {
        arr_data.splice(index, 1);
        return;
      }
    } while (target = Object.getPrototypeOf(target));
  }

}

__decorate([bindThis, __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], PropArrayHelper.prototype, "get", null);

__decorate([bindThis, __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object, Object]), __metadata("design:returntype", void 0)], PropArrayHelper.prototype, "add", null);

__decorate([bindThis, __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object, Object]), __metadata("design:returntype", void 0)], PropArrayHelper.prototype, "remove", null);

var THROTTLE_WRAP_PLOT;

(function (THROTTLE_WRAP_PLOT) {
  THROTTLE_WRAP_PLOT[THROTTLE_WRAP_PLOT["WAIT_RESULT_RETURN"] = 0] = "WAIT_RESULT_RETURN";
  THROTTLE_WRAP_PLOT[THROTTLE_WRAP_PLOT["NO_WAIT_EXEC_TIME"] = 1] = "NO_WAIT_EXEC_TIME";
})(THROTTLE_WRAP_PLOT || (THROTTLE_WRAP_PLOT = {}));

const NO_ALLOW_PROP = new Set([Symbol.toPrimitive, Symbol.toStringTag, Symbol.hasInstance, Symbol.species, /// 不能直接支持Symbol.iterator，只能用Symbol.asyncIterator来替代Symbol.iterator
Symbol.iterator, // Symbol.asyncIterator,
Symbol.isConcatSpreadable, Symbol.match, Symbol.matchAll, Symbol.replace, Symbol.search, Symbol.split]);

const __THEN_DISABLED__ = new WeakSet();

function createHolderProxyHanlder(holderReflect) {
  const proxyHanlder = {
    getPrototypeOf: () => {
      return null;
    },
    setPrototypeOf: () => {
      throw new Error("no support AsyncReflect.setPrototypeOf"); // return false;
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
    get: (_target, prop, r) => {
      // 禁止支持一些特定的symbol
      if (NO_ALLOW_PROP.has(prop)) {
        return;
      }

      if (prop === "then") {
        /// 一次性
        if (__THEN_DISABLED__.delete(holderReflect)) {
          return;
        }

        return (resolve, reject) => {
          holderReflect.toValueSync(ret => {
            if (ret.isError) {
              return reject(ret.error);
            }

            if (isHolder(ret.data)) {
              /// 如果是一个远端对象
              const thenFun = holderReflect.assetHolder("then");
              thenFun.Operator_typeOfHolder().toValueSync(typeNameRet => {
                if (typeNameRet.isError) {
                  return reject(typeNameRet.error);
                }

                if (typeNameRet.data === "function") {
                  thenFun.applyHolder(holderReflect.toHolder(), [resolve, reject]).toValueSync(() => {// 这个promise没人捕捉，也不需要捕捉
                  });
                } else {
                  /// 下面的resolve会导致再次触发then，所以这里要一次性进行then禁用
                  __THEN_DISABLED__.add(holderReflect);

                  resolve(ret.data);
                }
              });
            } else {
              /// 如果是一个本地对象
              if (ret.data && typeof ret.data["then"] === "function") {
                // 这个promise没人捕捉，也不需要捕捉
                ret.data.then(resolve, reject);
              } else {
                resolve(ret.data);
              }
            }
          });
        };
      }
      /**迭代器的支持 */


      if (prop === Symbol.asyncIterator) {
        return /*#__PURE__*/_wrapAsyncGenerator(function* () {
          if (yield _awaitAsyncGenerator(holderReflect.has(Symbol.asyncIterator))) {
            yield* _asyncGeneratorDelegate(_asyncIterator(holderReflect.asyncIterator()), _awaitAsyncGenerator);
          } else {
            yield* _asyncGeneratorDelegate(_asyncIterator(holderReflect.iterator()), _awaitAsyncGenerator);
          }
        });
      }

      return holderReflect.assetHolder(prop).toAsyncValue();
    },

    /**发送 set 操作 */
    set: (_target, prop, value, receiver) => {
      const setHolderReflect = holderReflect.setHolder(prop, value);
      let res = true;
      setHolderReflect.toValueSync(ret => {
        if (ret.isError === false) {
          res = ret.data;
        }
      });
      return res;
    },
    deleteProperty: (target, prop) => {
      const setHolderReflect = holderReflect.deletePropertyHolder(prop);
      let res = true;
      setHolderReflect.toValueSync(ret => {
        if (ret.isError === false) {
          res = ret.data;
        }
      });
      return res;
    },
    apply: (_target, thisArg, argArray) => {
      const applyHolderReflect = holderReflect.applyHolder(thisArg, argArray);
      applyHolderReflect.toValueSync(() => {///强行调取触发指令发送
      });
      return applyHolderReflect.toAsyncValue();
    },
    construct: (_target, argArray, newTarget) => {
      const constructHolderReflect = holderReflect.constructHolder(argArray, newTarget);
      constructHolderReflect.toValueSync(() => {///强行调取触发指令发送
      });
      return constructHolderReflect.toAsyncValue();
    }
  };
  return proxyHanlder;
}

const __HOLDER_REFLECT_WM__ = new WeakMap();

const __REFLECT_HOLDER_WM__ = new WeakMap();

function getHolder(holderReflect) {
  let holder = __REFLECT_HOLDER_WM__.get(holderReflect);

  if (holder === undefined) {
    holder = new Proxy(Function(`return function ${holderReflect.name}(){}`)(), createHolderProxyHanlder(holderReflect));

    __HOLDER_REFLECT_WM__.set(holder, holderReflect);

    __REFLECT_HOLDER_WM__.set(holderReflect, holder);
  }

  return holder;
}
function isHolder(target) {
  return __HOLDER_REFLECT_WM__.has(target);
}
function getHolderReflect(target) {
  return __HOLDER_REFLECT_WM__.get(target);
}

function CallbackToAsync(cbCaller, args, ctx) {
  let syncRet; /// 默认是同步模式

  let syncResolve = data => {
    syncRet = {
      isError: false,
      data
    };
  };

  let syncReject = error => {
    syncRet = {
      isError: true,
      error
    };
  };

  try {
    /// 执行，并尝试同步
    cbCaller.call(ctx, ret => {
      if (ret.isError) {
        syncReject(ret.error);
      } else {
        syncResolve(ret.data);
      }
    }, ...args);
  } catch (err) {
    syncReject(err);
  } /// 得到及时的响应，直接返回


  if (syncRet !== undefined) {
    return OpenArg(syncRet);
  } /// 没有得到及时的响应，进入异步模式


  return new Promise((resolve, reject) => {
    syncResolve = resolve;
    syncReject = reject;
  });
}
/**
 * ## 强泛型定义的bind实现
 * 这种写法很骚，因为一共定义了两套泛型，一套是由传入的cbCaller提供，一套由返回后，外界的调用者提供
 * 而cbCaller因为被夹在中间，要用于满足外界调用者的类型定义，所以在内部不得不any化
 *
 * ---
 * 但是这种推导也是**有条件的**
 * 举个例子:
 * ```ts
 * cbCaller = <A1>(cb: BFChainComlink.Callback<Result<A1>>, arg1: A1) => void
 * type Result<T> = ...
 * ```
 * 在上面这个例子中,终点在于 `Result<T>`，
 * 在这里 `R = Result<T>`， 同时 `R2 extends R`。
 * 所以当我们要用R2推导出R的时候， T此时就是由外部输入。
 *
 * 此时如果我们是这样定义 `type Result<T extends ...>` 就会可能出现问题。
 * 比如：
 * ```ts
 * cbCaller = <A1 extends keyof T>(cb: BFChainComlink.Callback<Result<T, A1>>, arg1: A1) => void
 * type Result<T, K extends keyof T> = T[K]
 * ```
 * 因为我们把原本有关系的 `Result<T,A1>` 和 `A1`，分解成了`R`与`ARGS`两个没有关系的类型。
 * 也就是说此时`R`与`ARGS`分别独立携带了一份`A1`，而`R`的那份`A1`则是由`R2`继承过去，用于接收外界的输入。
 * 也就会导致，当我们使用`R2`来尝试推理`A1`时，就会与`ARGS`携带进来的`A1`发生冲突。
 * 编译器无法认证到底要使用哪一种。
 */

function CallbackToAsyncBind(cbCaller, ctx) {
  return (...args) => CallbackToAsync(cbCaller, args, ctx);
}
function isNil(value) {
  return value === undefined || value === null;
}

class ReflectForbidenMethods {
  constructor() {
    // nullOrUndefine: reflectForbidenFactory('')
    this.deleteProperty = this._factory_NoObject("deleteProperty");
    this.defineProperty = this._factory_NoObject("defineProperty");
    this.ownKeys = this._factory_NoObject("ownKeys");
    this.has = this._factory_NoObject("has");
    this.set = this._factory_NoObject("set");
    this.get = this._factory_NoObject("get");
    this.getPrototypeOf = this._factory_NoObject("getPrototypeOf");
    this.isExtensible = this._factory_NoObject("isExtensible");
    this.preventExtensions = this._factory_NoObject("preventExtensions");
    this.setPrototypeOf = this._factory_NoObject("setPrototypeOf");
    this.apply = this._factory("apply", "[holder ${this.name}] is not a function");
    this.construct = this._factory("apply", "[holder ${this.name}] is not a constructor"); //   nilConvert = this._factory(
    //     "deleteProperty",
    //     "Cannot convert ${this.name}(undefined or null) to object",
    //   );
    //   nilSet = this._factory(
    //     "defineProperty",
    //     "Cannot set property '${arguments[0]}' of ${this.name}(undefined or null)",
    //   );

    this.nilGet = this._factory("defineProperty", "Cannot read property '${arguments[0]}' of ${this.name}(undefined or null)"); //   nilIn = this._factory(
    //     "has",
    //     "Cannot use 'in' operator to search for '${arguments[0]}' in ${this.name}(undefined or null)",
    //   );
  }

  _factory(method, errorMessage) {
    return Function(`return function ${method}Forbiden(){throw new TypeError(\`${errorMessage}\`)}`);
  }

  _factory_NoObject(method) {
    return this._factory(method, `Reflect.${method} called on non-object(\${this.name})`);
  }

}

var __decorate$1 = undefined && undefined.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
      r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
      d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};

var __metadata$1 = undefined && undefined.__metadata || function (k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
let ID_ACC = 0; //#region 一些辅助性函数

const reflectForbidenMethods = new ReflectForbidenMethods();
const refFunctionStaticToString = refFunctionStaticToStringFactory();
/**要兼容Primitive值 */

function alwaysTrueCallbackCaller(cb) {
  return cb({
    isError: false,
    data: true
  });
}

function alwaysFalseCallbackCaller(cb) {
  return cb({
    isError: false,
    data: false
  });
}

function alwaysUndefinedCallbackCaller(cb) {
  return cb({
    isError: false,
    data: undefined
  });
}

function end(iobCacher) {
  throw new TypeError(`unknown iobCacher type: ${iobCacher}`);
} //#endregion


class HolderReflect {
  constructor(linkSenderArgs, // public linkInSender: <R>(
  //   linkIn: readonly [EmscriptenReflect, ...unknown[]],
  //   hasOut?: BFChainComlink.HolderReflect<R> | false,
  // ) => unknown,
  core) {
    this.linkSenderArgs = linkSenderArgs;
    this.core = core;
    this.id = ID_ACC++;
    this.name = `holder_${this.id}`;
    this.staticMode = true;
  }

  toHolder() {
    return getHolder(this);
  } //#region Holder特有接口


  toValueSync(cb) {
    let iobCacher = this._iobCacher;
    let needSend = false;

    if (iobCacher === undefined) {
      needSend = true;
      iobCacher = this._iobCacher = {
        type: 0
        /* WAITING */
        ,
        waitter: []
      };
    }

    if (iobCacher.type === 0
    /* WAITING */
    ) {
        iobCacher.waitter.push(ret => {
          try {
            OpenArg(ret);
            iobCacher = this._iobCacher;

            if (!iobCacher || iobCacher.type === 0
            /* WAITING */
            ) {
                throw new TypeError();
              }

            this.toValueSync(cb);
          } catch (error) {
            cb({
              isError: true,
              error
            });
          }
        });

        if (needSend) {
          const {
            linkSenderArgs
          } = this;

          if (linkSenderArgs.linkIn.length === 0) {
            throw new TypeError();
          }

          if (linkSenderArgs.refId === undefined) {
            throw new TypeError("no refId");
          }

          this.core.transfer.sendLinkIn(linkSenderArgs.port, linkSenderArgs.refId, linkSenderArgs.linkIn, this); // this.linkInSender(this.linkIn as readonly [EmscriptenReflect, ...unknown[]], this);
        }

        return; // iobCacher = this._iobCacher;
      }

    if (iobCacher.type === 2
    /* LOCAL */
    || iobCacher.type === 4
    /* REMOTE_SYMBOL */
    ) {
        cb({
          isError: false,
          data: iobCacher.value
        });
        return;
      }

    if (iobCacher.type === 3
    /* REMOTE_REF */
    ) {
        cb({
          isError: false,
          data: this.toHolder()
        });
        return;
      }

    if (iobCacher.type === 1
    /* THROW */
    ) {
        this._getCatchedReflect().toValueSync(ret => {
          const error = OpenArg(ret);
          cb({
            isError: true,
            error: error
          });
        });

        return;
      }

    end(iobCacher);
  }

  get toValue() {
    return CallbackToAsyncBind(this.toValueSync, this);
  }

  toAsyncValue() {
    const iobCacher = this._iobCacher;

    if (iobCacher && (iobCacher.type === 2
    /* LOCAL */
    || iobCacher.type === 4
    /* REMOTE_SYMBOL */
    )) {
      return iobCacher.value;
    }

    return this.toHolder();
  }

  _getCatchedReflect() {
    let {
      _catchedReflect: _catched
    } = this;

    if (!_catched) {
      const {
        _iobCacher: iobCacher
      } = this;

      if ((iobCacher === null || iobCacher === void 0 ? void 0 : iobCacher.type) !== 1
      /* THROW */
      ) {
          throw new Error("no an error");
        }

      _catched = new HolderReflect(this.linkSenderArgs, this.core);

      _catched.bindIOB(iobCacher.cacher.iob);
    }

    return _catched;
  } // private _isError?


  bindIOB(iob, isError = false, port = this.core.port) {
    const {
      _iobCacher: iobCacher
    } = this; /// 如果已经存在iobCacher，而且不是waiting的状态，那么重复绑定了。注意不能用`iobCacher?.type`

    if (iobCacher !== undefined && iobCacher.type !== 0
    /* WAITING */
    ) {
        throw new TypeError("already bind iob");
      }

    const {
      exportStore,
      importStore
    } = this.core;
    let remoteIob;
    let newIobCacher; /// 解析iob，将之定义成local或者remote两种模式

    switch (iob.type) {
      case 3
      /* Locale */
      :
        const loc = exportStore.getObjById(iob.locId) || exportStore.getSymById(iob.locId);

        if (!loc) {
          throw new ReferenceError();
        }

        newIobCacher = {
          type: 2
          /* LOCAL */
          ,
          value: loc,
          iob
        };
        break;

      case 0
      /* Clone */
      :
        newIobCacher = {
          type: 2
          /* LOCAL */
          ,
          value: iob.data,
          iob
        };
        break;

      case 2
      /* Ref */
      :
        remoteIob = iob;
        newIobCacher = {
          type: 3
          /* REMOTE_REF */
          ,
          port,
          iob
        };
        break;

      case 1
      /* RemoteSymbol */
      :
        remoteIob = iob;
        let sourceSym;
        const refExtends = iob.extends;

        if (refExtends.global) {
          const globalSymInfo = globalSymbolStore.get(refExtends.description);

          if (!globalSymInfo) {
            throw new TypeError();
          }

          sourceSym = globalSymInfo.sym;
        } else {
          sourceSym = refExtends.unique ? Symbol.for(refExtends.description) : Symbol(refExtends.description);
        }

        newIobCacher = {
          type: 4
          /* REMOTE_SYMBOL */
          ,
          port,
          value: sourceSym,
          iob
        };
        break;
    }

    if (isError) {
      newIobCacher = {
        type: 1
        /* THROW */
        ,
        cacher: newIobCacher
      };
    }

    this._iobCacher = newIobCacher;

    if (remoteIob === undefined) {
      this.linkSenderArgs = _extends({}, this.linkSenderArgs, {
        refId: undefined
      });
    } else {
      // 保存引用信息
      importStore.idExtendsStore.set(remoteIob.refId, remoteIob.extends); /// 缓存对象

      importStore.saveProxyId(isError ? this._getCatchedReflect().toAsyncValue() : this.toAsyncValue(), remoteIob.refId); /// 它是有指令长度的，那么清空指令；对应的，需要重新生成指令发送器

      this.linkSenderArgs = _extends({}, this.linkSenderArgs, {
        refId: remoteIob.refId,
        linkIn: []
      });
    } /// 核心属性变更，清理所有getter缓存


    cleanAllGetterCache(this);
    iobCacher === null || iobCacher === void 0 ? void 0 : iobCacher.waitter.forEach(cb => {
      // try {
      cb({
        isError: false,
        data: undefined
      }); // } catch (err) {
      //   console.error("uncatch error", err);
      // }
    });
  }

  getIOB() {
    if (this._iobCacher && this._iobCacher.type !== 0
    /* WAITING */
    ) {
        if (this._iobCacher.type === 1
        /* THROW */
        ) {
            return this._iobCacher.cacher.iob;
          }

        return this._iobCacher.iob;
      }
  }

  isBindedIOB() {
    const {
      _iobCacher
    } = this;

    if (_iobCacher && _iobCacher.type !== 0
    /* WAITING */
    ) {
        return true;
      }

    return false;
  }

  waitIOB() {
    throw new Error("Method not implemented.");
  }

  createSubHolder(subHolderLinkIn) {
    const {
      linkSenderArgs
    } = this; /// 从空指令变成单指令

    if (linkSenderArgs.linkIn.length === 0) {
      return new HolderReflect(_extends({}, linkSenderArgs, {
        linkIn: subHolderLinkIn
      }), this.core);
    } /// 单指令变成多指令


    if (linkSenderArgs.linkIn[0] !== 18
    /* Multi */
    ) {
        return new HolderReflect(_extends({}, linkSenderArgs, {
          linkIn: [18
          /* Multi */
          , /// 加入原有的单指令
          linkSenderArgs.linkIn.length, ...linkSenderArgs.linkIn, /// 加入新的单指令
          subHolderLinkIn.length, ...subHolderLinkIn]
        }), this.core);
      } /// 维持多指令


    return new HolderReflect(_extends({}, linkSenderArgs, {
      linkIn: [...linkSenderArgs.linkIn, /// 加入新的单指令
      subHolderLinkIn.length, ...subHolderLinkIn]
    }), this.core);
  }

  _getSubHolderPrimitiveSync(linkIn, cb) {
    this.createSubHolder(linkIn).toValueSync(cb);
  } //#endregion
  //#region Reflect 接口
  //#region throw


  throw_binded(cb) {
    const iobCacher = this._iobCacher;

    if (iobCacher.type === 2
    /* LOCAL */
    || iobCacher.type === 4
    /* REMOTE_SYMBOL */
    ) {
        rejectCallback(cb, iobCacher.value);
        return;
      }

    if (iobCacher.type === 3
    /* REMOTE_REF */
    ) {
        rejectCallback(cb, this._getCatchedReflect().toHolder());
        return;
      }

    end(iobCacher);
  } // async throw() {
  //   const err = await this.toValue();
  //   throw err;
  //   // throw await this.toHolder().toString();
  //   // throw new Error("Method not implemented.");
  // }
  //#endregion
  //#region Reflect.apply


  apply_local(cb, thisArgument, argumentsList) {
    resolveCallback(cb, Reflect.apply(this._iobCacher.value, thisArgument, argumentsList));
  }

  applyHolder(thisArgument, argumentsList) {
    return this.createSubHolder([11
    /* Apply */
    , thisArgument, ...argumentsList]);
  }

  apply_remote(cb, thisArgument, argumentsList) {
    this.applyHolder(thisArgument, argumentsList).toValueSync(cb);
  }

  get applyCallback() {
    const {
      _iobCacher: iobCacher
    } = this;

    if ( // 未知，未发送
    !iobCacher || // 未知，未返回
    iobCacher.type === 0
    /* WAITING */
    || /// 已知，远端是函数
    iobCacher.type === 3
    /* REMOTE_REF */
    && iobCacher.iob.type === 2
    /* Ref */
    && iobCacher.iob.extends.type === 0
    /* Function */
    ) {
      return this.apply_remote;
    } /// 已知，本地函数


    if (iobCacher.type === 2
    /* LOCAL */
    && typeof iobCacher.value === "function") {
      return this.apply_local;
    } /// 其它


    if (iobCacher.type === 3
    /* REMOTE_REF */
    || iobCacher.type === 4
    /* REMOTE_SYMBOL */
    || iobCacher.type === 2
    /* LOCAL */
    ) {
        return reflectForbidenMethods.apply;
      }

    if (iobCacher.type === 1
    /* THROW */
    ) {
        return this.throw_binded;
      } /// 类型安全的非return结束


    end(iobCacher);
  }

  get apply() {
    return CallbackToAsyncBind(this.applyCallback, this);
  } //#endregion
  //#region Reflect.construct


  construct_local(cb, argumentsList, newTarget) {
    resolveCallback(cb, Reflect.construct(this._iobCacher.value, argumentsList, newTarget));
  }

  constructHolder(argumentsList, newTarget) {
    return this.createSubHolder([12
    /* Construct */
    , newTarget, ...argumentsList]);
  }

  construct_remote(cb, argumentsList, newTarget) {
    this.constructHolder(argumentsList, newTarget).toValueSync(cb);
  }

  get constructCallback() {
    const {
      _iobCacher: iobCacher
    } = this;

    if ( // 未知，未发送
    !iobCacher || // 未知，未返回
    iobCacher.type === 0
    /* WAITING */
    ) {
        return this.construct_remote;
      } /// 已知，远端是函数


    if (iobCacher.type === 3
    /* REMOTE_REF */
    && iobCacher.iob.type === 2
    /* Ref */
    && iobCacher.iob.extends.type === 0
    /* Function */
    ) {
        if (iobCacher.iob.extends.canConstruct) {
          return this.construct_remote;
        }

        return reflectForbidenMethods.construct;
      } /// 已知，本地是函数


    if (iobCacher.type === 2
    /* LOCAL */
    && typeof iobCacher.value === "function") {
      return this.construct_local;
    } /// 其它


    if (iobCacher.type === 3
    /* REMOTE_REF */
    || iobCacher.type === 4
    /* REMOTE_SYMBOL */
    || iobCacher.type === 2
    /* LOCAL */
    ) {
        return reflectForbidenMethods.apply;
      }

    if (iobCacher.type === 1
    /* THROW */
    ) {
        return this.throw_binded;
      } /// 类型安全的非return结束


    end(iobCacher);
  }

  get construct() {
    return CallbackToAsyncBind(this.constructCallback, this);
  } //#endregion
  //#region Reflect.defineProperty


  defineProperty_local(cb, propertyKey, attributes) {
    resolveCallback(cb, Reflect.defineProperty(this._iobCacher.value, propertyKey, attributes));
  }

  definePropertyHolder(propertyKey, attributes) {
    return this.createSubHolder([9
    /* DefineProperty */
    , propertyKey, attributes]);
  }

  defineProperty_remote(cb, propertyKey, attributes) {
    return this.definePropertyHolder(propertyKey, attributes).toValueSync(cb);
  }

  get definePropertyCallback() {
    const {
      _iobCacher: iobCacher
    } = this;

    if ( // 未知，未发送
    !iobCacher || // 未知，未返回
    iobCacher.type === 0
    /* WAITING */
    ) {
        return this.defineProperty_remote;
      } /// 已知，本地


    if (iobCacher.type === 2
    /* LOCAL */
    ) {
        return this.defineProperty_local;
      } /// 已知，远端
    /// 远端Symbol对象


    if (iobCacher.type === 4
    /* REMOTE_SYMBOL */
    ) {
        return reflectForbidenMethods.defineProperty;
      } /// 远端引用对象


    if (iobCacher.type === 3
    /* REMOTE_REF */
    ) {
        return this.defineProperty_remote;
      }

    if (iobCacher.type === 1
    /* THROW */
    ) {
        return this.throw_binded;
      } /// 类型安全的非return结束


    end(iobCacher);
  }

  get defineProperty() {
    return CallbackToAsyncBind(this.definePropertyCallback, this);
  } //#endregion
  //#region Reflect.deleteProperty


  deleteProperty_localObject(cb, propertyKey) {
    resolveCallback(cb, Reflect.deleteProperty(this._iobCacher.value, propertyKey));
  }

  deletePropertyHolder(propertyKey) {
    return this.createSubHolder([8
    /* DeleteProperty */
    , propertyKey]);
  }

  deleteProperty_remote(cb, propertyKey) {
    this.deletePropertyHolder(propertyKey).toValueSync(cb);
  }

  get deletePropertyCallback() {
    const {
      _iobCacher: iobCacher
    } = this;

    if ( // 未知，未发送
    !iobCacher || // 未知，未返回
    iobCacher.type === 0
    /* WAITING */
    || /// 已知，远端的非Symbol对象
    iobCacher.type === 3
    /* REMOTE_REF */
    ) {
        return this.deleteProperty_remote;
      } /// 已知，本地object


    if (iobCacher.type === 2
    /* LOCAL */
    ) {
        // object
        if (isObj(iobCacher.value)) {
          return this.deleteProperty_localObject;
        } // 本地 空值 原始值,


        return reflectForbidenMethods.deleteProperty;
      } /// 已知，远端Symbol,


    if (iobCacher.type === 4
    /* REMOTE_SYMBOL */
    ) {
        return reflectForbidenMethods.deleteProperty;
      }

    if (iobCacher.type === 1
    /* THROW */
    ) {
        return this.throw_binded;
      } /// 类型安全的非return结束


    end(iobCacher);
  }

  get deleteProperty() {
    return CallbackToAsyncBind(this.deletePropertyCallback, this);
  } //#endregion
  //#region Reflect.get


  get_remoteFunction(cb, propertyKey) {
    const iobExtends = this._iobCacher.iob.extends; /// 自定义属性

    if (propertyKey === IMPORT_FUN_EXTENDS_SYMBOL) {
      return resolveCallback(cb, iobExtends);
    }

    if (propertyKey === "name") {
      return resolveCallback(cb, iobExtends.name);
    }

    if (propertyKey === "length") {
      return resolveCallback(cb, iobExtends.length);
    }

    if (propertyKey === "arguments" || propertyKey === "callee" || propertyKey === "caller") {
      if (iobExtends.isStatic) {
        return rejectCallback(cb, new TypeError("'caller', 'callee', and 'arguments' properties may not be accessed on strict mode functions or the arguments objects for calls to them"));
      } else {
        /**
         * @TODO 这里的 arguments 和 caller 应该使用标准规范去实现
         * 无法用 await 来获取，需要调用者的堆栈信息来判定是否有权得到相关信息，
         */
        return resolveCallback(cb, null);
      }
    }
    /**
     * 静态的toString模式下的本地模拟
     * 本地模拟的toString，constructor和protoype等等属性都没有绑定远程
     * 这里纯粹是为了加速，模拟远端的返回，可以不用
     * @TODO 配置成可以可选模式
     */


    if (propertyKey === "toString" && iobExtends.toString.mode === 1
    /* static */
    ) {
        return resolveCallback(cb, refFunctionStaticToString);
      }
    /**
     * function.prototype 属性不是只读，所以跳过，使用远端获取
     * @TODO 改进 BFChainComlink.AsyncUtil.Remote 的规则
     */


    return this.get_remote(cb, propertyKey);
  }

  get_local(cb, propertyKey) {
    const iobCacher = this._iobCacher;
    resolveCallback(cb, Reflect.get(iobCacher.value, propertyKey));
  }

  getHolder(propertyKey) {
    return this.createSubHolder([6
    /* Get */
    , propertyKey]);
  }

  get_remote(cb, propertyKey) {
    this.getHolder(propertyKey).toValueSync(cb);
  }

  get getCallback() {
    const {
      _iobCacher: iobCacher
    } = this;

    if ( // 未知，未发送
    !iobCacher || // 未知，未返回
    iobCacher.type === 0
    /* WAITING */
    ) {
        return this.get_remote;
      } /// 已知，远端


    if (iobCacher.type === 3
    /* REMOTE_REF */
    ) {
        // function对象
        if (iobCacher.iob.type === 2
        /* Ref */
        && iobCacher.iob.extends.type === 0
        /* Function */
        ) {
            return this.get_remoteFunction;
          } // object


        return this.get_remote;
      } /// 已知, 远端Symbol、本地


    if (iobCacher.type === 4
    /* REMOTE_SYMBOL */
    ) {
        return reflectForbidenMethods.get;
      }

    if (iobCacher.type === 2
    /* LOCAL */
    ) {
        if (isObj(iobCacher.value)) {
          return this.get_local;
        }

        return reflectForbidenMethods.get;
      }

    if (iobCacher.type === 1
    /* THROW */
    ) {
        return this.throw_binded;
      } /// 类型安全的非return结束


    end(iobCacher);
  }

  get get() {
    return CallbackToAsyncBind(this.getCallback, this);
  } //#endregion
  //#region Reflect.getOwnPropertyDescriptor


  getOwnPropertyDescriptor_remoteFunction(cb, propertyKey) {
    const iobExtends = this._iobCacher.iob.extends;

    if (propertyKey === "name") {
      return resolveCallback(cb, {
        value: iobExtends.name,
        writable: false,
        enumerable: false,

        /* 远端的函数名，暂时强制不支持改名 */
        configurable: false
      });
    }

    if (propertyKey === "length") {
      return resolveCallback(cb, {
        value: iobExtends.length,
        writable: false,
        enumerable: false,

        /* 远端的函数名，暂时强制不支持length */
        configurable: false
      });
    }

    if (propertyKey === "arguments" || propertyKey === "callee" || propertyKey === "caller") {
      /**
       * iobExtends.isStatic === any
       * @TODO 这里的 arguments 和 caller 应该使用标准规范去实现
       * 无法用 await 来获取，需要调用者的堆栈信息来判定是否有权得到相关信息
       */
      return resolveCallback(cb, undefined);
    }
    /**
     * 静态的toString模式下的本地模拟
     * 本地模拟的toString，constructor和protoype等等属性都没有绑定远程
     * 这里纯粹是为了加速，模拟远端的返回，可以不用
     * @TODO 配置成可以可选模式
     */


    if (propertyKey === "toString" && iobExtends.toString.mode === 1
    /* static */
    ) {
        return resolveCallback(cb, {
          value: refFunctionStaticToString,
          writable: false,
          enumerable: false,

          /* 远端的函数名，强制修改了toString的实现 */
          configurable: false
        });
      }
    /**
     * function.prototype 属性不是只读，所以跳过，使用远端获取
     * @TODO 改进 BFChainComlink.AsyncUtil.Remote 的规则
     */


    return this.getOwnPropertyDescriptor_remote(cb, propertyKey);
  }

  getOwnPropertyDescriptor_local(cb, propertyKey) {
    const iobCacher = this._iobCacher;
    resolveCallback(cb, Reflect.getOwnPropertyDescriptor(iobCacher.value, propertyKey));
  }

  getOwnPropertyDescriptorHolder(propertyKey) {
    return this.createSubHolder([4
    /* GetOwnPropertyDescriptor */
    , propertyKey]);
  }

  getOwnPropertyDescriptor_remote(cb, propertyKey) {
    this.getOwnPropertyDescriptorHolder(propertyKey).toValueSync(cb);
  }

  get getOwnPropertyDescriptorCallback() {
    const {
      _iobCacher: iobCacher
    } = this;

    if ( // 未知，未发送
    !iobCacher || // 未知，未返回
    iobCacher.type === 0
    /* WAITING */
    ) {
        return this.getOwnPropertyDescriptor_remote;
      }

    if (iobCacher.type === 2
    /* LOCAL */
    ) {
        if (isObj(iobCacher.value)) {
          return this.getOwnPropertyDescriptor_local;
        }

        return alwaysUndefinedCallbackCaller;
      }

    if (iobCacher.type === 3
    /* REMOTE_REF */
    ) {
        if (iobCacher.iob.extends.type === 0
        /* Function */
        ) {
            return this.getOwnPropertyDescriptor_remoteFunction;
          }

        return this.getOwnPropertyDescriptor_remote;
      }

    if (iobCacher.type === 4
    /* REMOTE_SYMBOL */
    ) {
        return alwaysUndefinedCallbackCaller;
      }

    if (iobCacher.type === 1
    /* THROW */
    ) {
        return this.throw_binded;
      } /// 类型安全的非return结束


    end(iobCacher);
  }

  getOwnPropertyDescriptor(propertyKey) {
    return CallbackToAsync(this.getOwnPropertyDescriptorCallback, [propertyKey], this);
  } //#endregion
  //#region getPrototypeOf


  getPrototypeOf_local(cb) {
    const iobCacher = this._iobCacher;
    resolveCallback(cb, Reflect.getPrototypeOf(iobCacher.value));
  }

  getPrototypeOfHolder() {
    return this.createSubHolder([0
    /* GetPrototypeOf */
    ]);
  }

  getPrototypeOf_remote(cb) {
    this.getPrototypeOfHolder().toValueSync(cb);
  }

  get getPrototypeOfCallback() {
    const {
      _iobCacher: iobCacher
    } = this;

    if ( // 未知，未发送
    !iobCacher || // 未知，未返回
    iobCacher.type === 0
    /* WAITING */
    ) {
        return this.getPrototypeOf_remote;
      }

    if (iobCacher.type === 2
    /* LOCAL */
    ) {
        if (isObj(iobCacher.value)) {
          return this.getPrototypeOf_local;
        }

        return reflectForbidenMethods.getPrototypeOf;
      }

    if (iobCacher.type === 3
    /* REMOTE_REF */
    ||
    /**
     * 对于远端symbol，虽然本地有一个影子值，但还是要走远端获取
     */
    iobCacher.type === 4
    /* REMOTE_SYMBOL */
    ) {
        return this.getPrototypeOf_remote;
      }

    if (iobCacher.type === 1
    /* THROW */
    ) {
        return this.throw_binded;
      } /// 类型安全的非return结束


    end(iobCacher);
  }

  get getPrototypeOf() {
    return CallbackToAsyncBind(this.getPrototypeOfCallback, this);
  } //#endregion
  //#region Reflect.has


  has_remoteFunction(cb, propertyKey) {
    /**
     * 只要是函数（不论是否是箭头函数），就必然有这些属性
     */
    if ( /// T1 自身属性
    propertyKey === "name" || propertyKey === "length") {
      return resolveCallback(cb, true);
    }

    const iobExtends = this._iobCacher.iob.extends;
    /**
     * 被优化过的模式
     * @TODO 可以提供性能模式，来对export的函数统一进行Object.seal操作
     */

    if ((iobExtends.status & 2
    /* update */
    && iobExtends.instanceOfFunction) !== 0) {
      if ( /// T2 自身属性 / 原型链
      propertyKey === "arguments" || propertyKey === "callee" || propertyKey === "caller" || /// T3 Function.原型链
      propertyKey === "toString" || propertyKey === "constructor" || propertyKey === "apply" || propertyKey === "bind" || propertyKey === "call" || propertyKey === Symbol.hasInstance || /// T3 Object.原型链
      propertyKey === "toLocaleString" || propertyKey === "valueOf" || propertyKey === "isPrototypeOf" || propertyKey === "propertyIsEnumerable" || propertyKey === "hasOwnProperty" /// T4 非标准属性，v8引擎特有
      // __proto__,__defineGetter__,__defineSetter__,__lookupGetter__,__lookupSetter__
      ) {
          return true;
        }
    } /// T2 自身属性 / 原型链


    if (propertyKey === "arguments" || propertyKey === "callee" || propertyKey === "caller") {
      /// 非严格函数，属于旧版函数，必然有这些属性
      if (iobExtends.isStatic === false) {
        return resolveCallback(cb, true);
      } /// 严格函数，可能被修改过原型链，所以也说不定

    }

    return this.has_remote(cb, propertyKey);
  }

  has_local(cb, propertyKey) {
    const iobCacher = this._iobCacher;
    resolveCallback(cb, Reflect.has(iobCacher.value, propertyKey));
  }

  hasHolder(propertyKey) {
    return this.createSubHolder([5
    /* Has */
    , propertyKey]);
  }

  has_remote(cb, propertyKey) {
    return this.hasHolder(propertyKey).toValueSync(cb);
  }

  get hasCallback() {
    const {
      _iobCacher: iobCacher
    } = this;

    if ( // 未知，未发送
    !iobCacher || // 未知，未返回
    iobCacher.type === 0
    /* WAITING */
    ) {
        return this.has_remote;
      }

    if (iobCacher.type === 2
    /* LOCAL */
    ) {
        if (isObj(iobCacher.value)) {
          return this.has_local;
        }

        return reflectForbidenMethods.has;
      }

    if (iobCacher.type === 3
    /* REMOTE_REF */
    ) {
        if (iobCacher.iob.extends.type === 0
        /* Function */
        ) {
            return this.has_remoteFunction;
          }

        return this.has_remote;
      }

    if (iobCacher.type === 4
    /* REMOTE_SYMBOL */
    ) {
        /// 远端的symbol和本地symbol行为是一样的，所以使用本地
        return this.has_local;
      }

    if (iobCacher.type === 1
    /* THROW */
    ) {
        return this.throw_binded;
      } /// 类型安全的非return结束


    end(iobCacher);
  }

  get has() {
    return CallbackToAsyncBind(this.hasCallback, this);
  } //#endregion
  //#region Reflect.isExtensible


  isExtensible_local(cb) {
    const iobCacher = this._iobCacher;
    resolveCallback(cb, Reflect.isExtensible(iobCacher.value));
  }

  isExtensibleHolder() {
    return this.createSubHolder([2
    /* IsExtensible */
    ]);
  }

  isExtensible_remote(cb) {
    this.isExtensibleHolder().toValueSync(cb);
  }

  get isExtensibleCallback() {
    const {
      _iobCacher: iobCacher
    } = this;

    if ( // 未知，未发送
    !iobCacher || // 未知，未返回
    iobCacher.type === 0
    /* WAITING */
    ) {
        return this.isExtensible_remote;
      }

    if (iobCacher.type === 2
    /* LOCAL */
    ) {
        if (isObj(iobCacher.value)) {
          return this.isExtensible_local;
        }

        return reflectForbidenMethods.isExtensible;
      }

    if (iobCacher.type === 3
    /* REMOTE_REF */
    ) {
        if (iobCacher.iob.extends.status & 3
        /* preventedExtensions */
        ) {
            return alwaysFalseCallbackCaller;
          }

        return this.isExtensible_remote;
      }

    if (iobCacher.type === 4
    /* REMOTE_SYMBOL */
    ) {
        /// 远端的symbol和本地symbol行为是一样的，所以使用本地
        return reflectForbidenMethods.isExtensible;
      }

    if (iobCacher.type === 1
    /* THROW */
    ) {
        return this.throw_binded;
      } /// 类型安全的非return结束


    end(iobCacher);
  }

  get isExtensible() {
    return CallbackToAsyncBind(this.isExtensibleCallback, this);
  } //#endregion
  //#region Reflect.ownKeys


  ownKeys_local(cb) {
    const iobCacher = this._iobCacher;
    resolveCallback(cb, Reflect.ownKeys(iobCacher.value));
  }

  ownKeysHolder() {
    return this.createSubHolder([10
    /* OwnKeys */
    ]);
  }

  ownKeys_remote(cb) {
    this.ownKeysHolder().toValueSync(cb);
  }

  get ownKeysCallback() {
    const {
      _iobCacher: iobCacher
    } = this;

    if ( // 未知，未发送
    !iobCacher || // 未知，未返回
    iobCacher.type === 0
    /* WAITING */
    || iobCacher.type === 3
    /* REMOTE_REF */
    ) {
        return this.ownKeys_remote;
      }

    if (iobCacher.type === 2
    /* LOCAL */
    ) {
        if (isObj(iobCacher.value)) {
          return this.ownKeys_local;
        }

        return reflectForbidenMethods.ownKeys;
      }

    if (iobCacher.type === 4
    /* REMOTE_SYMBOL */
    ) {
        /// 远端的symbol和本地symbol行为是一样的，所以使用本地
        return reflectForbidenMethods.ownKeys;
      }

    if (iobCacher.type === 1
    /* THROW */
    ) {
        return this.throw_binded;
      } /// 类型安全的非return结束


    end(iobCacher);
  }

  get ownKeys() {
    return CallbackToAsyncBind(this.ownKeysCallback, this);
  } //#endregion
  //#region Reflect.preventExtensions


  preventExtensions_local(cb) {
    const iobCacher = this._iobCacher;
    resolveCallback(cb, Reflect.preventExtensions(iobCacher.value));
  }

  preventExtensionsHolder() {
    return this.createSubHolder([3
    /* PreventExtensions */
    ]);
  }

  preventExtensions_remote(cb) {
    this.preventExtensionsHolder().toValueSync(cb);
  }

  preventExtensions_onceRemote(cb) {
    const iobCacher = this._iobCacher;
    iobCacher.iob.extends.status &= 3
    /* preventedExtensions */
    ;
    cleanGetterCache(this, "preventExtensionsCallback");
    cleanGetterCache(this, "preventExtensions");
    return this.preventExtensions_remote(cb);
  }

  get preventExtensionsCallback() {
    const {
      _iobCacher: iobCacher
    } = this;

    if ( // 未知，未发送
    !iobCacher || // 未知，未返回
    iobCacher.type === 0
    /* WAITING */
    ) {
        return this.preventExtensions_remote;
      }

    if (iobCacher.type === 3
    /* REMOTE_REF */
    ) {
        /// 严格模式能满足遵守规则的代码
        if (this.staticMode) {
          if ((iobCacher.iob.extends.status & 3
          /* preventedExtensions */
          ) !== 0) {
            /// 如果已经是冻结状态，那么直接返回
            return alwaysTrueCallbackCaller;
          } /// 非冻结状态，那么只需要触发一次也就不需要再触发，也是永久返回true


          return this.preventExtensions_onceRemote;
        }
        /**
         * 非严格模式，要考虑对方可能是Proxy对象，所以不能以当前的属性状态做判定
         */


        return this.preventExtensions_remote;
      }

    if (iobCacher.type === 2
    /* LOCAL */
    ) {
        if (isObj(iobCacher.value)) {
          return this.preventExtensions_local;
        }

        return reflectForbidenMethods.preventExtensions;
      }

    if (iobCacher.type === 4
    /* REMOTE_SYMBOL */
    ) {
        /// 远端的symbol和本地symbol行为是一样的，所以使用本地
        return reflectForbidenMethods.preventExtensions;
      }

    if (iobCacher.type === 1
    /* THROW */
    ) {
        return this.throw_binded;
      } /// 类型安全的非return结束


    end(iobCacher);
  }

  get preventExtensions() {
    return CallbackToAsyncBind(this.preventExtensionsCallback, this);
  } //#endregion
  //#region Reflect.set


  set_local(cb, propertyKey, value) {
    const iobCacher = this._iobCacher;
    resolveCallback(cb, Reflect.set(iobCacher.value, propertyKey, value));
  }

  setHolder(propertyKey, value) {
    return this.createSubHolder([7
    /* Set */
    , propertyKey, value]);
  }

  set_remote(cb, propertyKey, value) {
    return this.setHolder(propertyKey, value).toValueSync(cb);
  }

  get setCallback() {
    const {
      _iobCacher: iobCacher
    } = this;

    if ( // 未知，未发送
    !iobCacher || // 未知，未返回
    iobCacher.type === 0
    /* WAITING */
    ) {
        return this.set_remote;
      }

    if (iobCacher.type === 3
    /* REMOTE_REF */
    ) {
        /// 严格模式能满足遵守规则的代码，如果已经是冻结状态，那么直接返回
        if (this.staticMode && (iobCacher.iob.extends.status & 2
        /* update */
        ) !== 0) {
          /// 如果已经是冻结状态，那么直接返回
          return alwaysFalseCallbackCaller;
        }

        return this.set_remote;
      }

    if (iobCacher.type === 2
    /* LOCAL */
    ) {
        if (isObj(iobCacher.value)) {
          return this.set_local;
        }

        return reflectForbidenMethods.set;
      }

    if (iobCacher.type === 4
    /* REMOTE_SYMBOL */
    ) {
        /// 远端的symbol和本地symbol行为是一样的，所以使用本地
        return reflectForbidenMethods.set;
      }

    if (iobCacher.type === 1
    /* THROW */
    ) {
        return this.throw_binded;
      } /// 类型安全的非return结束


    end(iobCacher);
  }

  get set() {
    return CallbackToAsyncBind(this.setCallback, this);
  } //#endregion


  setPrototypeOf_local(cb, proto) {
    const iobCacher = this._iobCacher;
    resolveCallback(cb, Reflect.setPrototypeOf(iobCacher.value, proto));
  }

  setPrototypeOfHolder(proto) {
    return this.createSubHolder([1
    /* SetPrototypeOf */
    , proto]);
  }

  setPrototypeOf_remote(cb, proto) {
    return this.setPrototypeOfHolder(proto).toValueSync(cb);
  }

  get setPrototypeOfCallback() {
    const {
      _iobCacher: iobCacher
    } = this;

    if ( // 未知，未发送
    !iobCacher || // 未知，未返回
    iobCacher.type === 0
    /* WAITING */
    ) {
        return this.setPrototypeOf_remote;
      }

    if (iobCacher.type === 3
    /* REMOTE_REF */
    ) {
        /// 严格模式能满足遵守规则的代码，如果已经是冻结状态，那么直接返回
        if (this.staticMode && (iobCacher.iob.extends.status & 3
        /* preventedExtensions */
        ) !== 0) {
          /// 如果已经是冻结状态，那么直接返回
          return alwaysFalseCallbackCaller;
        }

        return this.setPrototypeOf_remote;
      }

    if (iobCacher.type === 2
    /* LOCAL */
    ) {
        if (isObj(iobCacher.value)) {
          return this.setPrototypeOf_local;
        }

        return reflectForbidenMethods.setPrototypeOf;
      }

    if (iobCacher.type === 4
    /* REMOTE_SYMBOL */
    ) {
        /// 远端的symbol和本地symbol行为是一样的，所以使用本地
        return reflectForbidenMethods.setPrototypeOf;
      }

    if (iobCacher.type === 1
    /* THROW */
    ) {
        return this.throw_binded;
      } /// 类型安全的非return结束


    end(iobCacher);
  }

  get setPrototypeOf() {
    return CallbackToAsyncBind(this.setPrototypeOfCallback, this);
  } //#endregion
  //#region Reflect 拓展接口

  /**
   * @WARN 不支持 with 操作符与对应的 Symbol.unscopables
   */


  asset_value(cb, propertyKey) {
    const iobCacher = this._iobCacher;
    resolveCallback(cb, iobCacher.value[propertyKey]);
  }

  assetHolder(propertyKey) {
    return this.createSubHolder([13
    /* Asset */
    , propertyKey]);
  }

  asset_remote(cb, propertyKey) {
    this.assetHolder(propertyKey).toValueSync(cb);
  }

  get assetCallback() {
    const {
      _iobCacher: iobCacher
    } = this;

    if ( // 未知，未发送
    !iobCacher || // 未知，未返回
    iobCacher.type === 0
    /* WAITING */
    ) {
        return this.asset_remote;
      } /// 已知，远端


    if (iobCacher.type === 3
    /* REMOTE_REF */
    ) {
        // function对象
        if (iobCacher.iob.type === 2
        /* Ref */
        && iobCacher.iob.extends.type === 0
        /* Function */
        ) {
            return this.get_remoteFunction;
          } // object


        return this.get_remote;
      } /// 已知, 远端Symbol、本地


    if (iobCacher.type === 4
    /* REMOTE_SYMBOL */
    ) {
        return this.asset_value;
      }

    if (iobCacher.type === 2
    /* LOCAL */
    ) {
        if (isNil(iobCacher.value)) {
          return reflectForbidenMethods.nilGet;
        }

        return this.asset_value;
      }

    if (iobCacher.type === 1
    /* THROW */
    ) {
        return this.throw_binded;
      } /// 类型安全的非return结束


    end(iobCacher);
  }
  /**
   * 访问表达式，类似Reflect.get，但支持primitive
   * @param cb
   * @param propertyKey
   */


  get asset() {
    return CallbackToAsyncBind(this.assetCallback, this);
  }
  /**支持自定义的Symbol.toPrimitive以及Symbol.toStringTag，前者优先级更高 */


  toPrimitive(hint) {}
  /**instanceof 的操作符，支持自定义的Symbol.hasInstance */


  Operator_instanceOf(Ctor) {}

  Operator_instanceOfHolder(Ctor) {
    return this.createSubHolder([15
    /* Instanceof */
    , Ctor]);
  }
  /**typeof 的操作符*/


  Operator_typeOf() {}

  Operator_typeOfHolder() {
    return this.createSubHolder([14
    /* Typeof */
    ]);
  }
  /**delete 的操作符，支持primitive*/


  Operator_delete() {}
  /**... 的操作符*/


  Operator_spread() {}
  /**in 的操作符，支持自定义的Symbol.species*/


  Operator_in() {}
  /**
   * @TIP 如果未来Emscripten支持《自定义运算符》，那么这里就需要扩展出更多的操作符了，因为这些操作都是只支持同步的。
   */

  /**支持自定义的Symbol.iterator，本地可用for await来进行迭代 */


  iterator() {
    var _this = this;

    return _wrapAsyncGenerator(function* () {
      const iterable = yield _awaitAsyncGenerator(_this.assetHolder(Symbol.iterator).apply(_this.toAsyncValue(), []));

      do {
        const item = yield _awaitAsyncGenerator(iterable.next());

        if (yield _awaitAsyncGenerator(item.done)) {
          break;
        }

        yield item.value;
      } while (true);
    })();
  }
  /**支持自定义的Symbol.asyncIterator，本地可用for await来进行迭代 */


  asyncIterator() {
    var _this2 = this;

    return _wrapAsyncGenerator(function* () {
      const iterable = yield _awaitAsyncGenerator(_this2.assetHolder(Symbol.asyncIterator).apply(_this2.toAsyncValue(), []));

      do {
        const item = yield _awaitAsyncGenerator(iterable.next());

        if (yield _awaitAsyncGenerator(item.done)) {
          break;
        }

        yield item.value;
      } while (true);
    })();
  }
  /**支持自定义的Symbol.isConcatSpreadable */


  Array_concat() {}
  /**支持自定义的Symbol.match */


  String_match() {}
  /**支持自定义的Symbol.matchAll */


  String_matchAll() {}
  /**支持自定义的Symbol.replace */


  String_replace() {}
  /**支持自定义的Symbol.search */


  String_search() {}
  /**支持自定义的Symbol.split */


  String_split() {}

  Object_assign() {}

  Object_create() {}

  Object_defineProperties() {}

  Object_defineProperty() {}

  Object_entries() {}

  Object_freeze() {}

  Object_fromEntries() {}

  Object_getOwnPropertyDescriptor() {}

  Object_getOwnPropertyDescriptors() {}

  Object_getOwnPropertyNames() {}

  Object_getOwnPropertySymbols() {}

  Object_getPrototypeOf() {}

  Object_is() {}

  Object_isExtensible() {}

  Object_isFrozen() {}

  Object_isSealed() {}

  Object_keys() {}

  Object_preventExtensions() {}

  Object_seal() {}

  Object_setPrototypeOf() {}

  Object_values() {}

  JSON_stringify() {
    return this.createSubHolder([16
    /* JsonStringify */
    ]);
  }

  JSON_parse() {
    return this.createSubHolder([17
    /* JsonParse */
    ]);
  }

}
HolderReflect.isHolder = isHolder;
HolderReflect.getHolderReflect = getHolderReflect;

__decorate$1([cacheGetter, __metadata$1("design:type", Object), __metadata$1("design:paramtypes", [])], HolderReflect.prototype, "toValue", null);

__decorate$1([cacheGetter, __metadata$1("design:type", Object), __metadata$1("design:paramtypes", [])], HolderReflect.prototype, "applyCallback", null);

__decorate$1([cacheGetter, __metadata$1("design:type", Object), __metadata$1("design:paramtypes", [])], HolderReflect.prototype, "apply", null);

__decorate$1([cacheGetter, __metadata$1("design:type", Object), __metadata$1("design:paramtypes", [])], HolderReflect.prototype, "constructCallback", null);

__decorate$1([cacheGetter, __metadata$1("design:type", Object), __metadata$1("design:paramtypes", [])], HolderReflect.prototype, "construct", null);

__decorate$1([cacheGetter, __metadata$1("design:type", Object), __metadata$1("design:paramtypes", [])], HolderReflect.prototype, "defineProperty", null);

__decorate$1([cacheGetter, __metadata$1("design:type", Object), __metadata$1("design:paramtypes", [])], HolderReflect.prototype, "deleteProperty", null);

__decorate$1([cacheGetter, __metadata$1("design:type", Object), __metadata$1("design:paramtypes", [])], HolderReflect.prototype, "get", null);

__decorate$1([cacheGetter, __metadata$1("design:type", Object), __metadata$1("design:paramtypes", [])], HolderReflect.prototype, "getPrototypeOf", null);

__decorate$1([cacheGetter, __metadata$1("design:type", Object), __metadata$1("design:paramtypes", [])], HolderReflect.prototype, "has", null);

__decorate$1([cacheGetter, __metadata$1("design:type", Object), __metadata$1("design:paramtypes", [])], HolderReflect.prototype, "isExtensible", null);

__decorate$1([cacheGetter, __metadata$1("design:type", Object), __metadata$1("design:paramtypes", [])], HolderReflect.prototype, "ownKeys", null);

__decorate$1([cacheGetter, __metadata$1("design:type", Object), __metadata$1("design:paramtypes", [])], HolderReflect.prototype, "preventExtensionsCallback", null);

__decorate$1([cacheGetter, __metadata$1("design:type", Object), __metadata$1("design:paramtypes", [])], HolderReflect.prototype, "preventExtensions", null);

__decorate$1([cacheGetter, __metadata$1("design:type", Object), __metadata$1("design:paramtypes", [])], HolderReflect.prototype, "set", null);

__decorate$1([cacheGetter, __metadata$1("design:type", Object), __metadata$1("design:paramtypes", [])], HolderReflect.prototype, "setPrototypeOf", null);

__decorate$1([cacheGetter, __metadata$1("design:type", Object), __metadata$1("design:paramtypes", [])], HolderReflect.prototype, "asset", null);

__decorate$1([bindThis, __metadata$1("design:type", Function), __metadata$1("design:paramtypes", []), __metadata$1("design:returntype", void 0)], HolderReflect.prototype, "iterator", null);

__decorate$1([bindThis, __metadata$1("design:type", Function), __metadata$1("design:paramtypes", []), __metadata$1("design:returntype", void 0)], HolderReflect.prototype, "asyncIterator", null);

class AsyncModelTransfer extends ModelTransfer {
  constructor(core) {
    super(core);
    /**
     * ref fun statis toString
     */

    this._rfsts = refFunctionStaticToStringFactory();
  }
  /**这里保持使用cb风格，可以确保更好的性能
   * @TODO 内部的函数也应该尽可能使用cb风格来实现
   */


  sendLinkIn(port, targetId, linkIn, hasOut) {
    const {
      transfer
    } = this.core;

    const doReq = linkInIob => {
      port.req(async function (ret) {
        const bin = OpenArg(ret);
        const linkObj = transfer.transferableBinary2LinkObj(bin);

        if (linkObj.type !== 3
        /* Out */
        ) {
            throw new TypeError();
          }

        if (linkObj.isThrow) {
          const err_iob = linkObj.out.slice().pop();

          if (!err_iob) {
            throw new TypeError();
          }

          if (hasOut) {
            hasOut.bindIOB(err_iob, true);
          } else {
            /// 远端传来的异常，本地却没有可以捕捉的对象，协议不对称！
            throw err_iob;
          }
        } else if (hasOut) {
          const res_iob = linkObj.out.slice().pop();

          if (!res_iob) {
            throw new TypeError();
          }

          hasOut.bindIOB(res_iob);
        }
      }, transfer.linkObj2TransferableBinary({
        type: 2
        /* In */
        ,
        // reqId,
        targetId,
        in: linkInIob,
        hasOut: hasOut !== undefined
      }));
    }; /// 无参数需要解析，那么直接发送指令


    if (linkIn.length === 0) {
      doReq(linkIn);
    } else {
      /**结果列表 */
      const linkInIOB = [];
      /**结果列表的实际长度 */

      let linkInIOBLength = 0;
      /**是否已经完成中断 */

      let isRejected = false; /// 解析所有的参数

      for (let index = 0; index < linkIn.length; index++) {
        const item = linkIn[index];
        transfer.Any2InOutBinary(ret => {
          if (isRejected) {
            return;
          }

          if (ret.isError) {
            isRejected = true;

            if (hasOut) {
              hasOut.bindIOB({
                type: 0
                /* Clone */
                ,
                data: ret.error
              }, true);
            } else {
              throw ret.error; // console.error("uncatch error:", ret.error);
            }

            return;
          } /// 保存解析结果


          linkInIOB[index] = ret.data;
          linkInIOBLength += 1; /// 完成所有任务，执行指令发送

          if (linkInIOBLength === linkIn.length) {
            doReq(linkInIOB);
          }
        }, item);
      }
    }
  }
  /**
   * 主动生成引用代理
   * @param port
   * @param refId
   */


  _createHolderByRefId(port, refId, iob) {
    const holder = this._getHolder(port, refId, iob);

    return holder.toAsyncValue();
  }

  _getHolder(port, refId, iob) {
    const holder = new HolderReflect({
      port,
      refId,
      linkIn: []
    }, this.core);
    holder.bindIOB(iob);
    return holder;
  } // linkInSenderFactory(port: ComlinkProtocol.BinaryPort, refId: number) {
  //   return <R>(
  //     linkIn: readonly [EmscriptenReflect, ...unknown[]],
  //     hasOut?: BFChainComlink.HolderReflect<R> | false,
  //   ) => this.sendLinkIn(port, refId, linkIn, hasOut);
  // }


  Any2InOutBinary(cb, obj) {
    const reflectHolder = getHolderReflect(obj);

    if (reflectHolder !== undefined) {
      const iob = reflectHolder.getIOB();

      if (!iob) {
        /// 还没有绑定，那么就等待其绑定完成
        return reflectHolder.toValueSync(valRet => {
          if (valRet.isError) {
            return cb(valRet);
          }

          this.Any2InOutBinary(cb, obj);
        }); // throw new TypeError(`reflectHolder ${reflectHolder.name} no bind iob`);
      }

      if (iob.type === 0
      /* Clone */
      ) {
          obj = iob.data;
        }
    }

    return super.Any2InOutBinary(cb, obj);
  }

  InOutBinary2Any(bin) {
    const {
      port,
      importStore,
      exportStore
    } = this.core;

    switch (bin.type) {
      //   case LinkItemType.Default:
      //     return defaultCtx;
      case 3
      /* Locale */
      :
        const loc = exportStore.getObjById(bin.locId) || exportStore.getSymById(bin.locId);

        if (!loc) {
          throw new ReferenceError();
        }

        return loc;

      case 2
      /* Ref */
      :
      case 1
      /* RemoteSymbol */
      :
        /// 读取缓存中的应用对象
        let cachedHolder = importStore.getProxyById(bin.refId);

        if (cachedHolder === undefined) {
          /// 使用导入功能生成对象
          cachedHolder = this._createHolderByRefId(port, bin.refId, bin);
        }

        return cachedHolder;

      case 0
      /* Clone */
      :
        return bin.data;
    }

    throw new TypeError();
  }

}

class ComlinkAsync extends ComlinkCore {
  constructor(port, name) {
    super(port, name);
    this.transfer = new AsyncModelTransfer(this);
  }

  wrap(val) {
    throw new Error("Method not implemented.");
  } // readonly holderStore = new HolderStore(this.name);


  $getEsmReflectHanlder(opeartor) {
    const hanlder = super.$getEsmReflectHanlder(opeartor);

    if (opeartor === 11
    /* Apply */
    || opeartor === 19
    /* SyncApply */
    ) {
        const applyHanlder = (target, args) => {
          if (target === Function.prototype.toString) {
            const ctx = args[0];
            const exportDescriptor = getFunctionExportDescription(ctx); /// 保护源码

            if (!exportDescriptor.showSourceCode) {
              // console.log("get to string from remote");
              return IOB_EFT_Factory_Map.get(getFunctionType(ctx)).toString({
                name: ctx.name
              });
            }
          }

          return hanlder.fun(target, args);
        };

        return {
          type: hanlder.type,
          fun: applyHanlder
        };
      }

    return hanlder;
  }

  async import(key = "default") {
    const importModule = await CallbackToAsync(this.$getImportModule, [], this);
    return Reflect.get(importModule, key);
  }

}

var __decorate$2 = undefined && undefined.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
      r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
      d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};

var __metadata$2 = undefined && undefined.__metadata || function (k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
class AtomicsNotifyer {
  constructor(_port) {
    this._port = _port;
    this._icbs = new Map();
    this._remoteMode = 3
    /* UNKNOWN */
    ;

    this._port.onMessage(data => {
      if (data instanceof Array) {
        for (const index of data) {
          const cbs = this._icbs.get(index);

          if (cbs !== undefined) {
            this._icbs.delete(index);

            for (const cb of cbs) {
              cb();
            }
          }
        }
      }
    });
  }

  waitAsync(si32, index, value) {
    return new Promise(resolve => {
      this.waitCallback(si32, index, value, resolve);
    });
  }

  waitCallback(si32, index, value, cb) {
    if (Atomics.load(si32, index) !== value) {
      return cb();
    }

    let cbs = this._icbs.get(index);

    if (cbs === undefined) {
      cbs = [cb];

      this._icbs.set(index, cbs);
    } else {
      cbs.push(cb);
    }
  }

  set remoteMode(mode) {
    if (this._remoteMode !== mode) {
      this._remoteMode = mode;
      cleanGetterCache(this, "notify");
    }
  }

  get remoteMode() {
    return this._remoteMode;
  }

  get notify() {
    if (this._remoteMode === 2
    /* ASYNC */
    ) {
        return this._notify_async;
      }

    if (this._remoteMode === 1
    /* SYNC */
    ) {
        return this._notify_sync;
      }

    return this._notify_unknow;
  }

  _notify_unknow(si32, indexs) {
    this._notify_async(si32, indexs);

    this._notify_sync(si32, indexs);
  }

  _notify_async(si32, indexs) {
    this._port.postMessage(indexs);
  }

  _notify_sync(si32, indexs) {
    for (const index of indexs) {
      Atomics.notify(si32, index);
    }
  }

}

__decorate$2([cacheGetter, __metadata$2("design:type", Object), __metadata$2("design:paramtypes", [])], AtomicsNotifyer.prototype, "notify", null);

function u8Concat(ABC, u8s) {
  let totalLen = 0;

  for (const u8 of u8s) {
    totalLen += u8.length;
  }

  const u8a = new Uint8Array(new ABC(totalLen));
  let offsetLen = 0;

  for (const u8 of u8s) {
    u8a.set(u8, offsetLen);
    offsetLen += u8.length;
  }

  return u8a;
}

class DataPkg {
  constructor(name, sab) {
    this.name = name;
    this.sab = sab;
    this.si32 = new Int32Array(this.sab);
    this.su8 = new Uint8Array(this.sab);
    this.su16 = new Uint16Array(this.sab);
  }

}

class U32Reader {
  constructor() {
    this._u32 = new Uint32Array(1);
    this._u8 = new Uint8Array(this._u32.buffer);
  }

  setByU8(u8) {
    this._u8.set(u8);

    return this;
  }

  getU32() {
    return this._u32[0];
  }

}

const u32 = new U32Reader();

const serialize = data => {
  const json = JSON.stringify(data);
  const u8 = new Uint8Array(json.length);

  for (let i = 0; i < json.length; i++) {
    const code = json.charCodeAt(i);

    if (code > 256) {
      throw new RangeError("");
    }

    u8[i] = code;
  }

  return u8;
};

const deserialize = u8 => {
  let json = "";

  for (const code of u8) {
    json += String.fromCharCode(code);
  }

  return JSON.parse(json);
};
class Duplex {
  constructor(_port, sabs) {
    this._port = _port;
    this._notifyer = new AtomicsNotifyer(this._port);
    this._eventId = new Uint32Array(1);
    this._chunkCollection = new Map();
    this.supportModes = new Set();
    this._cbs = []; // Reflect.set(globalThis, "duplex", this);

    this.supportModes.add("async");
    this.supportModes.add("sync");
    const localeDataPkg = new DataPkg("locale", sabs.locale);
    const remoteDataPkg = new DataPkg("remote", sabs.remote);
    this._sync = {
      sabs,
      localeDataPkg,
      remoteDataPkg
    };

    _port.onMessage(data => {
      if (data instanceof Array) {
        this._checkRemote();
      }
    });
  }

  static getPort(duplex) {
    return duplex._port;
  }
  /**发送异步消息 */


  postAsyncMessage(msg) {
    this._postMessageCallback(hook => {
      this._notifyer.waitCallback(hook.si32, 0
      /* SI32_MSG_TYPE */
      , hook.curMsgType, hook.next);
    }, hook => {
      this._notifyer.waitCallback(hook.si32, 0
      /* SI32_MSG_TYPE */
      , hook.msgType, hook.next);
    }, msg);
  }

  postSyncMessage(msg) {
    this._postMessageCallback(hook => {
      this._checkRemoteAtomics(); // console.debug(threadId, "+openSAB");


      Atomics.wait(hook.si32, 0
      /* SI32_MSG_TYPE */
      , hook.curMsgType); // console.debug(threadId, "-openSAB");

      hook.next();
    }, hook => {
      this._checkRemoteAtomics(); // console.debug(threadId, "+waitSAB");
      // 进入等待


      Atomics.wait(hook.si32, 0
      /* SI32_MSG_TYPE */
      , hook.msgType); // console.debug(threadId, "-waitSAB");

      hook.next();
    }, msg);
  }

  waitMessage() {
    do {
      // 等待对方开始响应
      Atomics.wait(this._sync.remoteDataPkg.si32, 0
      /* SI32_MSG_TYPE */
      , 0
      /* FREE */
      ); // 处理响应的内容

      const msg = this._checkRemoteAtomics();

      if (msg) {
        return msg;
      }
    } while (true);
  }

  _postMessageCallback(onApplyWrite, onChunkReady, msg) {
    // console.debug("postMessage", threadId, msg);
    const msgBinary = this._serializeMsg(msg);

    const sync = this._sync;
    const {
      su8,
      si32,
      su16
    } = sync.localeDataPkg; // 数据id，用于将数据包和事件进行关联的ID

    const eventId = this._eventId[0]++; //#region 首先传输数据包

    {
      /// 自动分包模式
      const MSG_MAX_BYTELENGTH = su8.byteLength - 20
      /* U8_MSG_DATA_OFFSET */
      ;
      const chunkCount = Math.ceil(msgBinary.byteLength / MSG_MAX_BYTELENGTH);
      let chunkId = 0;
      let msgOffset = 0; // msgBinary.byteLength

      /**尝试写入 */

      const tryWriteChunk = () => {
        if (chunkId >= chunkCount) {
          return;
        } // 申请写入权


        checkAndApplyWrite();
      };
      /**申请写入权 */


      const checkAndApplyWrite = () => {
        // 直接申请
        const cur_msg_type = Atomics.compareExchange(si32, 0
        /* SI32_MSG_TYPE */
        , 0
        /* FREE */
        , 1
        /* EVENT */
        ); /// 申请成功

        if (cur_msg_type === 0
        /* FREE */
        ) {
            // 开始写入状态
            Atomics.store(si32, 1
            /* SI32_MSG_STATUS */
            , 0
            /* WRITING */
            );
            doWriteChunk();
            return;
          } // 直接申请失败，转交给外部，让外部去申请


        onApplyWrite({
          si32,
          msgType: 1
          /* EVENT */
          ,
          curMsgType: cur_msg_type,
          next: checkAndApplyWrite
        });
      };
      /**获取写入权后，写入数据 */


      const doWriteChunk = () => {
        // 写入消息ID
        si32[2
        /* U32_EVENT_ID_INDEX */
        ] = eventId; // 写入总包数

        su16[5
        /* U16_CHUNK_COUNT_INDEX */
        ] = chunkCount; // 写入包编号

        su16[6
        /* U16_CHUNK_ID_INDEX */
        ] = chunkId; // 取出可以用于发送的数据包

        const msgChunk = msgBinary.subarray(msgOffset, // 累加偏移量
        Math.max(msgBinary.byteLength, msgOffset += MSG_MAX_BYTELENGTH)); // 写入数据包的大小

        si32[4
        /* U32_MSG_CHUNK_SIZE_INDEX */
        ] = msgChunk.byteLength; // 写入数据

        su8.set(msgChunk, 20
        /* U8_MSG_DATA_OFFSET */
        ); // 写入完成

        Atomics.store(si32, 1
        /* SI32_MSG_STATUS */
        , 1
        /* FINISH */
        ); // 广播变更

        this._notifyer.notify(si32, [0
        /* SI32_MSG_TYPE */
        , 1
        /* SI32_MSG_STATUS */
        ]); // 钩子参数


        const hook = {
          msgType: 1
          /* EVENT */
          ,
          si32,
          chunkId,
          chunkCount,
          next: tryWriteChunk
        }; // 累加分包ID

        chunkId++; // 告知外部，写入完成了

        onChunkReady(hook);
      }; // 开始尝试写入


      tryWriteChunk();
    } //#endregion
  }
  /**主动检测远端是否发来消息 */


  _checkRemoteAtomics() {
    const {
      remoteDataPkg
    } = this._sync; /// 如果本地还未收到消息，而且远端的堆栈信息不为空，那么就可以开始处理

    if (this._needOnMessageAtomics(remoteDataPkg)) {
      return this._onMessage(remoteDataPkg);
    }
  }

  _checkRemote() {
    const {
      remoteDataPkg
    } = this._sync; /// 如果本地还未收到消息，而且远端的堆栈信息不为空，那么就可以开始处理

    if (this._needOnMessage(remoteDataPkg)) {
      return this._onMessage(remoteDataPkg);
    }
  }
  /**是否需要处理消息 */


  _needOnMessageAtomics(dataPkg) {
    if (dataPkg.si32[0
    /* SI32_MSG_TYPE */
    ] !== 0
    /* FREE */
    ) {
        do {
          const cur_msg_status = dataPkg.si32[1
          /* SI32_MSG_STATUS */
          ];

          if (cur_msg_status === 1
          /* FINISH */
          ) {
              break;
            } // console.debug(threadId, "+needOnMessage");


          Atomics.wait(dataPkg.si32, 1
          /* SI32_MSG_STATUS */
          , cur_msg_status); // console.debug(threadId, "-needOnMessage");
        } while (true);

        return true;
      }

    return false;
  }
  /**是否需要处理消息 */


  _needOnMessage(dataPkg) {
    return dataPkg.si32[0
    /* SI32_MSG_TYPE */
    ] !== 0
    /* FREE */
    && dataPkg.si32[1
    /* SI32_MSG_STATUS */
    ] === 1
    /* FINISH */
    ;
  }
  /**处理消息指令 */


  _onMessage(dataPkg) {
    const {
      si32,
      su8,
      su16
    } = dataPkg;

    switch (si32[0
    /* SI32_MSG_TYPE */
    ]) {
      case 1
      /* EVENT */
      :
        {
          /**事件ID */
          const eventId = si32[2
          /* U32_EVENT_ID_INDEX */
          ];
          /**分包的数量 */

          const chunkCount = su16[5
          /* U16_CHUNK_COUNT_INDEX */
          ];
          /**数据包编号*/

          const chunkId = su16[6
          /* U16_CHUNK_ID_INDEX */
          ];
          /**数据包大小 */

          const chunkSize = si32[4
          /* U32_MSG_CHUNK_SIZE_INDEX */
          ];
          /**数据包 */

          const chunk = su8.subarray(20
          /* U8_MSG_DATA_OFFSET */
          , 20
          /* U8_MSG_DATA_OFFSET */
          + chunkSize);
          let cachedChunkInfo;
          let msgBinary; /// 单包

          if (1 === chunkCount) {
            msgBinary = new Uint8Array(chunk);
          } else {
            /// 分包
            cachedChunkInfo = this._chunkCollection.get(eventId);

            if (cachedChunkInfo) {
              cachedChunkInfo.set(chunkId, chunk); /// 如果数据包已经完整了，那么整理出完整的数据包

              if (cachedChunkInfo.size === chunkCount) {
                // 删除缓存
                this._chunkCollection.delete(eventId); /// 合并分包


                const chunkList = [];
                /**
                 * 这里支持无序传输，如果底层使用WebRTC，可以更节省设备资源
                 */

                for (const chunkItem of cachedChunkInfo) {
                  chunkList[chunkItem[0]] = chunkItem[1];
                }

                msgBinary = u8Concat(ArrayBuffer, chunkList);
              }
            } else {
              cachedChunkInfo = new Map();
              cachedChunkInfo.set(chunkId, new Uint8Array(chunk));
            }
          } // 释放调度
          // this._closeSAB(si32);


          Atomics.store(si32, 0
          /* SI32_MSG_TYPE */
          , 0
          /* FREE */
          );

          this._notifyer.notify(si32, [0
          /* SI32_MSG_TYPE */
          ]); /// 如果有完整的数据包，那么触发事件


          if (msgBinary) {
            // 触发事件
            return this._msgBinaryHandler(msgBinary);
          }
        }
        break;
    }
  }

  _msgBinaryHandler(msgBinary) {
    // console.debug("onMessage", threadId, msgBinary);
    let msg;

    try {
      switch (msgBinary[0]) {
        case 1
        /* REQ */
        :
          msg = {
            msgType: "REQ",
            msgId: u32.setByU8(msgBinary.subarray(1, 5
            /* Uint32Array.BYTES_PER_ELEMENT+1 */
            )).getU32(),
            msgContent: deserialize(msgBinary.subarray(5))
          };
          break;

        case 2
        /* RES */
        :
          msg = {
            msgType: "RES",
            msgId: u32.setByU8(msgBinary.subarray(1, 5
            /* Uint32Array.BYTES_PER_ELEMENT+1 */
            )).getU32(),
            msgContent: deserialize(msgBinary.subarray(5))
          };
          break;

        case 0
        /* SIM */
        :
          msg = {
            msgType: "SIM",
            msgId: undefined,
            msgContent: deserialize(msgBinary.subarray(1))
          };
          break;

        default:
          throw new TypeError(`unknown msgType:'${msgBinary[0]}'`);
      }
    } catch (err) {
      debugger;
      throw err;
    }

    for (const cb of this._cbs) {
      cb(msg);
    }

    return msg;
  }

  onMessage(cb) {
    this._cbs.push(cb);
  } /// 消息序列化
  // private _msg_ABC: typeof SharedArrayBuffer | typeof ArrayBuffer = ArrayBuffer;


  _serializeMsg(msg) {
    let msgBinary;

    if (msg.msgType === "SIM") {
      msgBinary = u8Concat(ArrayBuffer, [[0
      /* SIM */
      ], serialize(msg.msgContent)]);
    } else {
      msgBinary = u8Concat(ArrayBuffer, [[msg.msgType === "REQ" ? 1
      /* REQ */
      : 2
      /* RES */
      ], new Uint8Array(new Uint32Array([msg.msgId]).buffer), serialize(msg.msgContent)]);
    }

    return msgBinary;
  }

}

class MagicBinaryPort {
  constructor(_duplex) {
    this._duplex = _duplex;
    this._reqId = new Uint32Array(1);
    this._resMap = new Map();

    _duplex.onMessage(msg => {
      if (msg.msgType === "RES") {
        const resId = msg.msgId;

        const output = this._resMap.get(resId);

        if (!output) {
          throw new TypeError("no found responser"); // return;
        }

        this._resMap.delete(resId);

        const ret = msg.msgContent;
        SyncForCallback(output, () => {
          const resBin = OpenArg(ret);

          if (!resBin) {
            throw new TypeError();
          }

          return resBin;
        });
      } else {
        const reqId = msg.msgId;

        this._reqHandler(ret => {
          if (reqId === undefined) {
            return;
          }

          this._postModeMessage({
            msgType: "RES",
            msgId: reqId,
            msgContent: ret
          });
        }, msg.msgContent);
      }
    });
  }

  onMessage(listener) {
    this._reqHandler = listener;
  }

  send(bin) {
    this._duplex.postAsyncMessage({
      msgType: "SIM",
      msgId: undefined,
      msgContent: bin
    });
  }

}
class SyncBinaryPort extends MagicBinaryPort {
  _postModeMessage(msg) {
    this._duplex.postSyncMessage(msg);
  }

  req(output, bin) {
    const reqId = this._reqId[0]++;
    let hasOutput = false;

    const reqOutput = ret => {
      hasOutput = true;
      output(ret);
    }; // 先存放回调


    this._resMap.set(reqId, reqOutput); // 发送，同步模式会直接触发回调


    this._postModeMessage({
      msgType: "REQ",
      msgId: reqId,
      msgContent: bin
    }); /// 同步模式：发送完成后，马上就需要对方有响应才意味着 postMessage 完成


    while (hasOutput === false) {
      this._duplex.waitMessage();
    }
  }

}
class AsyncBinaryPort extends MagicBinaryPort {
  _postModeMessage(msg) {
    this._duplex.postAsyncMessage(msg);
  }

  req(output, bin) {
    const reqId = this._reqId[0]++;

    this._resMap.set(reqId, output);

    this._postModeMessage({
      msgType: "REQ",
      msgId: reqId,
      msgContent: bin
    });
  }

}

class MagicBinaryChannel {
  constructor(_duplex, localSab = new SharedArrayBuffer(1024), remoteSab = new SharedArrayBuffer(1024)) {
    this._duplex = _duplex;
    this.localSab = localSab;
    this.remoteSab = remoteSab;
  }

}

class SyncBinaryChannel extends MagicBinaryChannel {
  constructor() {
    super(...arguments);
    this.port = new SyncBinaryPort(this._duplex);
  }

}
class AsyncBinaryChannel extends MagicBinaryChannel {
  constructor() {
    super(...arguments);
    this.port = new AsyncBinaryPort(this._duplex);
  }

}

class Comlink {
  constructor(options) {}

  asyncModule(moduleName, duplex) {
    if (!duplex.supportModes.has("async")) {
      throw new TypeError("duplex no support async mode");
    }

    const binaryChannel = new AsyncBinaryChannel(duplex);
    return new ComlinkAsync(binaryChannel.port, moduleName);
  }

  syncModule(moduleName, duplex) {
    if (!duplex.supportModes.has("sync")) {
      throw new TypeError("duplex no support sync mode");
    }

    const binaryChannel = new SyncBinaryChannel(duplex);
    return new ComlinkSync(binaryChannel.port, moduleName);
  }

}

class Endpoint {
  constructor(_port) {
    this._port = _port;
    this.postMessage = this._port.postMessage.bind(this._port);
  }

  onMessage(listener) {
    this._port.start();

    this._port.addEventListener("message", e => listener(e.data));
  }

} // export const EndpointFactory: BFChainComlink.Duplex.EndpointFactory = (port: MessagePort) => {
//   return new Endpoint(port);
// };

const PORT_SABS_WM = new WeakMap();
class DuplexFactory {
  constructor(_mc = new MessageChannel()) {
    this._mc = _mc;
  }
  /**作为子线程运作 */


  static async asCluster(workerSelf) {
    let sabs;
    const port2 = await new Promise((resolve, reject) => {
      const onMessage = me => {
        const {
          data
        } = me;

        if (data instanceof MessagePort) {
          resolve(data);
          workerSelf.removeEventListener("message", onMessage);
        } else if (data instanceof Array && data[0] instanceof SharedArrayBuffer && data[1] instanceof SharedArrayBuffer) {
          sabs = {
            locale: data[0],
            remote: data[1]
          };
        }
      };

      workerSelf.addEventListener("message", onMessage);
    });

    if (!sabs) {
      throw new TypeError();
    }

    PORT_SABS_WM.set(port2, sabs);
    const duplex = new Duplex(new Endpoint(port2), sabs);
    return duplex;
  }

  _getSabs(port) {
    let sabs = PORT_SABS_WM.get(port);

    if (undefined === sabs) {
      try {
        sabs = {
          locale: new SharedArrayBuffer(1024),
          remote: new SharedArrayBuffer(1024)
        };
        PORT_SABS_WM.set(port, sabs);
      } catch (err) {
        console.error(err);
        throw new SyntaxError("no support use SharedArrayBuffer");
      }
    }

    return sabs;
  }
  /**创建出专门用于传输协议数据的双工通道 */


  getDuplex() {
    let duplex = this._duplex;

    if (!duplex) {
      const sabs = this._getSabs(this._mc.port1);

      duplex = new Duplex(new Endpoint(this._mc.port1), sabs);
      this._duplex = duplex;
    }

    return duplex;
  }
  /**作为主线程运作 */


  asMain(workerIns) {
    const sabs = this._getSabs(this._mc.port1);

    try {
      workerIns.postMessage([sabs.remote, sabs.locale]);
    } catch (err) {
      console.error(err);
      throw new SyntaxError("no support use transfer SharedArrayBuffer in channel");
    }

    workerIns.postMessage(this._mc.port2, [this._mc.port2]);
  }

}

class TaskLog {
  constructor(groupName) {
    this.groupName = groupName;
    this._fails = [];
    this.log = console.log;
    this.warn = console.warn;
    this.error = console.error;
    this.info = console.info;
    this.debug = console.debug;
  }

  assert(isTrue, msg) {
    if (!isTrue) {
      this._fails.push(msg);
    }

    console.assert(isTrue, msg);
  }

  finish() {
    if (this._fails.length === 0) {
      console.log(`✅ ~ all [${this.groupName}] test passed!`);
    } else {
      console.error(`⛔ [${this.groupName}] has ${this._fails.length} test failed.`);
    }
  }

}

const comlink = new Comlink();
async function installWebEnv(scriptUrl, mainThreadCallback, workerThreadCallback, workerThreadCallback2) {
  var _a, _b;

  if (scriptUrl) {
    console.log("main started"); /// 模拟A模块作为服务模块

    try {
      {
        const duplexFactory = new DuplexFactory();
        /**模块控制器 */

        const moduleA = comlink.asyncModule("A", duplexFactory.getDuplex()); // 执行回调

        await mainThreadCallback(moduleA);
        {
          /// 启动子线程，并将messagechannel发送给子线程
          const worker = new Worker(scriptUrl, {
            name: "async"
          });

          worker.onmessage = e => e.data === "exit" && worker.terminate(); // 执行发送


          duplexFactory.asMain(worker);
        }
      }
      {
        const duplexFactory2 = new DuplexFactory();
        const moduleA2 = comlink.asyncModule("A", duplexFactory2.getDuplex()); // 执行回调

        await mainThreadCallback(moduleA2);
        {
          /// 启动子线程，并将messagechannel发送给子线程
          const worker = new Worker(scriptUrl, {
            name: "sync"
          });

          worker.onmessage = e => e.data === "exit" && worker.terminate(); // 执行发送


          duplexFactory2.asMain(worker);
        }
      }
    } catch (err) {
      console.error("❌ Main Error", (_a = err === null || err === void 0 ? void 0 : err.stack) !== null && _a !== void 0 ? _a : err);
      return;
    }
  } else {
    const mode = self.name;
    const console = new TaskLog(`mix-${mode}`);
    console.log(`worker ${mode} started`);

    try {
      /// 等待通道连接到位
      const duplex = await DuplexFactory.asCluster(self);

      if (mode === "async") {
        /// 模拟B模块作为调用模块

        /**模块控制器 */
        const moduleB = comlink.asyncModule("B", duplex); // 回调

        await workerThreadCallback(moduleB, console);
      } else {
        /**模块控制器 */
        const moduleB2 = comlink.syncModule("B2", duplex); // 回调

        await workerThreadCallback2(moduleB2, console);
      }

      console.finish();
    } catch (err) {
      console.error("❌ Worker Error", (_b = err === null || err === void 0 ? void 0 : err.stack) !== null && _b !== void 0 ? _b : err);
    } // 退出子线程


    setTimeout(() => {
      self.postMessage("exit");
    }, 10);
  }
}

function testRunner(scriptUrl) {
  const A = "~aAa~";
  installWebEnv(scriptUrl, moduleA => {
    /**随便一个常量 */
    const a = A;
    moduleA.export(a, "a");
    moduleA.export(document, "document");
  }, async (moduleB, console) => {
    const a = await moduleB.import("a");
    Reflect.set(globalThis, "a", a);
    console.assert(a === A, "import");
    const document = await moduleB.import("document");
    Reflect.set(globalThis, "document", document);
    const div = await document.createElement("div");
    const id = `id-${self.name}-${Math.random().toString(36).slice(2)}`;
    const textContent = `T~${self.name}~#${id}~T`;
    div.id = id;
    div.textContent = textContent;
    document.body.appendChild(div);
    console.log(await div.textContent);
    console.assert((await div.textContent) === textContent, "textContent");
    const div2 = await document.querySelector("#" + id);
    console.assert(JSON.stringify(HolderReflect.getHolderReflect(div).getIOB()) === JSON.stringify(HolderReflect.getHolderReflect(div2).getIOB()), "ref");
  }, (moduleB, console) => {
    /// test import
    const a = moduleB.import("a");
    Reflect.set(self, "a", a);
    console.assert(a === A, "import");
    const document = moduleB.import("document");
    Reflect.set(self, "document", document);
    const div = document.createElement("div");
    const id = `id-${self.name}-${Math.random().toString(36).slice(2)}`;
    const textContent = `T~${self.name}~#${id}~T`;
    div.id = id;
    div.textContent = textContent;
    document.body.appendChild(div);
    console.assert(div.textContent === textContent, "textContent");
    const div2 = document.querySelector("#" + id);
    console.assert(div2 === div, "ref");
  });
}

Reflect.set(self, "testRunner", testRunner);

if (typeof document !== "object") {
  testRunner();
} else {
  testRunner(document.querySelector("script").src);
}
//# sourceMappingURL=comlink-test-web.modern.js.map
