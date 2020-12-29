(function (factory) {
  typeof define === 'function' && define.amd ? define(factory) :
  factory();
}((function () {
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

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
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

  function _inheritsLoose(subClass, superClass) {
    subClass.prototype = Object.create(superClass.prototype);
    subClass.prototype.constructor = subClass;
    subClass.__proto__ = superClass;
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
  }

  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;

    for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

    return arr2;
  }

  function _createForOfIteratorHelperLoose(o, allowArrayLike) {
    var it;

    if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) {
      if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
        if (it) o = it;
        var i = 0;
        return function () {
          if (i >= o.length) return {
            done: true
          };
          return {
            done: false,
            value: o[i++]
          };
        };
      }

      throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }

    it = o[Symbol.iterator]();
    return it.next.bind(it);
  }

  /**
   * 不能使用instanceof，会触发Proxy的getPrototypeOf
   * @param obj
   */
  var isObj = function isObj(obj) {
    var targetType = typeof obj;
    return targetType === "object" && obj !== null || targetType === "function";
  };

  var checkUnregisterToken = function checkUnregisterToken(unregisterToken) {
    if (!isObj(unregisterToken)) {
      throw new TypeError("unregisterToken ('" + unregisterToken + "') must be an object");
    }
  };

  var checkTarget = function checkTarget(target) {
    if (!isObj(target)) {
      throw new TypeError("target must be an object");
    }
  };

  if (typeof WeakRef === "undefined") {
    var wr = new WeakMap();

    var _WeakRef = /*#__PURE__*/function () {
      function _WeakRef(target) {
        checkTarget(target);
        wr.set(this, target);
      }

      var _proto = _WeakRef.prototype;

      _proto.deref = function deref() {
        return wr.get(this);
      };

      return _WeakRef;
    }();

    Object.defineProperty(globalThis, "WeakRef", {
      value: _WeakRef
    }); ///
  }

  if (typeof FinalizationRegistry === "undefined") {
    if (typeof FinalizationGroup !== "undefined") {
      var _FinalizationRegistry = /*#__PURE__*/function () {
        function _FinalizationRegistry(cleanupCallback) {
          this.fg = new FinalizationGroup(function (heldValueIter) {
            for (var _iterator = _createForOfIteratorHelperLoose(heldValueIter), _step; !(_step = _iterator()).done;) {
              var heldValue = _step.value;
              cleanupCallback(heldValue);
            }
          });
        }

        var _proto2 = _FinalizationRegistry.prototype;

        _proto2.register = function register(target, heldValue, unregisterToken) {
          this.fg.register(target, heldValue, unregisterToken);
        };

        _proto2.unregister = function unregister(unregisterToken) {
          this.fg.unregister(unregisterToken);
        };

        return _FinalizationRegistry;
      }();

      Object.defineProperty(globalThis, "FinalizationRegistry", {
        value: _FinalizationRegistry
      });
    } else {
      var _FinalizationRegistry2 = /*#__PURE__*/function () {
        function _FinalizationRegistry2(cleanupCallback) {}

        var _proto3 = _FinalizationRegistry2.prototype;

        _proto3.register = function register(target, heldValue, unregisterToken) {
          checkTarget(target);

          if (unregisterToken !== undefined) {
            checkUnregisterToken(unregisterToken);
          }
        };

        _proto3.unregister = function unregister(unregisterToken) {
          checkUnregisterToken(unregisterToken);
        };

        return _FinalizationRegistry2;
      }();

      Object.defineProperty(globalThis, "FinalizationRegistry", {
        value: _FinalizationRegistry2
      });
    }
  }

  function _catch(body, recover) {
    try {
      var result = body();
    } catch (e) {
      return recover(e);
    }

    if (result && result.then) {
      return result.then(void 0, recover);
    }

    return result;
  }

  var ESM_REFLECT_FUN_MAP = new Map([[0
  /* GetPrototypeOf */
  , _SyncToCallback(function (target) {
    return Reflect.getPrototypeOf(target);
  })], [1
  /* SetPrototypeOf */
  , _SyncToCallback(function (target, _ref) {
    var proto = _ref[0];
    return Reflect.setPrototypeOf(target, proto);
  })], [2
  /* IsExtensible */
  , _SyncToCallback(function (target) {
    return Reflect.isExtensible(target);
  })], [3
  /* PreventExtensions */
  , _SyncToCallback(function (target) {
    return Reflect.preventExtensions(target);
  })], [4
  /* GetOwnPropertyDescriptor */
  , _SyncToCallback(function (target, _ref2) {
    var prop = _ref2[0];
    return Reflect.getOwnPropertyDescriptor(target, prop);
  })], [5
  /* Has */
  , _SyncToCallback(function (target, _ref3) {
    var prop = _ref3[0];
    return Reflect.has(target, prop);
  })], [6
  /* Get */
  , _SyncToCallback(function (target, _ref4) {
    var prop = _ref4[0];
    return Reflect.get(target, prop);
  })], [7
  /* Set */
  , _SyncToCallback(function (target, _ref5) {
    var prop = _ref5[0],
        value = _ref5[1];
    return Reflect.set(target, prop, value);
  })], [8
  /* DeleteProperty */
  , _SyncToCallback(function (target, _ref6) {
    var prop = _ref6[0];
    return Reflect.deleteProperty(target, prop);
  })], [9
  /* DefineProperty */
  , _SyncToCallback(function (target, _ref7) {
    var prop = _ref7[0],
        attr = _ref7[1];
    return Reflect.defineProperty(target, prop, attr);
  })], [10
  /* OwnKeys */
  , _SyncToCallback(function (target) {
    return Reflect.ownKeys(target);
  })], [11
  /* Apply */
  , _SyncToCallback(function (target, _ref8) {
    var ctx = _ref8[0],
        args = _ref8.slice(1);

    return Reflect.apply(target, ctx, args);
  })], [19
  /* SyncApply */
  , {
    type: "async",
    fun: function fun(target, _ref9) {
      var ctx = _ref9[0],
          args = _ref9.slice(1);

      return Reflect.apply(target, ctx, args);
    }
  }], [20
  /* AsyncApply */
  , {
    type: "sync",
    fun: function fun(target, _ref10) {
      var resolve = _ref10[0],
          reject = _ref10[1],
          ctx = _ref10[2],
          args = _ref10.slice(3);

      return queueMicrotask(function () {
        try {
          var _temp2 = _catch(function () {
            return Promise.resolve(Reflect.apply(target, ctx, args)).then(function (res) {
              resolve(res);
            });
          }, function (err) {
            reject(err);
          });

          return Promise.resolve(_temp2 && _temp2.then ? _temp2.then(function () {}) : void 0);
        } catch (e) {
          return Promise.reject(e);
        }
      });
    }
  }], [12
  /* Construct */
  , _SyncToCallback(function (target, _ref11) {
    var newTarget = _ref11[0],
        args = _ref11.slice(1);

    return Reflect.construct(target, args, newTarget);
  })], /// 运算符
  [13
  /* Asset */
  , _SyncToCallback(function (target, _ref12) {
    var prop = _ref12[0];
    return target[prop];
  })], [14
  /* Typeof */
  , _SyncToCallback(function (target) {
    return typeof target;
  })], [15
  /* Instanceof */
  , _SyncToCallback(function (target, _ref13) {
    var ctor = _ref13[0];
    return target instanceof ctor;
  })], [16
  /* JsonStringify */
  , _SyncToCallback(function (target) {
    return JSON.stringify(target);
  })], [17
  /* JsonParse */
  , _SyncToCallback(function (target) {
    return JSON.parse(target);
  })]]);

  function _SyncToCallback(handler) {
    return {
      type: "sync",
      fun: handler
    };
  }

  var SyncForCallback = function SyncForCallback(cb, handler) {
    try {
      cb({
        isError: false,
        data: handler()
      });
    } catch (error) {
      cb({
        isError: true,
        error: error
      });
    }
  };
  function resolveCallback(cb, data) {
    cb({
      isError: false,
      data: data
    });
  }
  function rejectCallback(cb, error) {
    cb({
      isError: true,
      error: error
    });
  }
  /**
   * 生成一个回调函数，通过指定的处理函数，最终传输给cb风格的出口
   * @param output
   * @param transformer
   */

  var SyncPiperFactory = function SyncPiperFactory(output, transformer) {
    return function () {
      try {
        output({
          isError: false,
          data: transformer.apply(void 0, [].slice.call(arguments))
        });
      } catch (error) {
        output({
          isError: true,
          error: error
        });
      }
    };
  };
  var OpenArg = function OpenArg(arg) {
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

  var ExportStore = /*#__PURE__*/function () {
    function ExportStore(name) {
      this.name = name;
      /**
       * 提供给远端的 refId|symId
       * 远端可以使用 locId 来进行访问本地
       */

      this.accId = 0;
      /**我所导出的引用对象与符号 */

      this.objIdStore = new Map();
    }

    var _proto = ExportStore.prototype;

    _proto.getObjById = function getObjById(id) {
      var cache = this.objIdStore.get(id);

      if (cache && cache.type === 0
      /* Object */
      ) {
          return cache.obj;
        }
    };

    _proto.getSymById = function getSymById(id) {
      var cache = this.objIdStore.get(id);

      if (cache && cache.type === 1
      /* Symbol */
      ) {
          return cache.sym;
        }
    };

    _proto.getId = function getId(obj) {
      var cache = this.objIdStore.get(obj);
      return cache === null || cache === void 0 ? void 0 : cache.id;
    }
    /**
     * 保存对象的引用
     */
    ;

    _proto.saveObjId = function saveObjId(obj, id) {
      if (id === void 0) {
        id = this.accId++;
      }

      var cache = {
        type: 0
        /* Object */
        ,
        obj: obj,
        id: id
      };
      this.objIdStore.set(id, cache);
      this.objIdStore.set(obj, cache);
      return id;
    }
    /**
     * 保存符号
     */
    ;

    _proto.saveSymId = function saveSymId(sym, id) {
      if (id === void 0) {
        id = this.accId++;
      }

      var cache = {
        type: 1
        /* Symbol */
        ,
        sym: sym,
        id: id
      };
      this.objIdStore.set(id, cache);
      this.objIdStore.set(sym, cache);
      return id;
    }
    /**
     * 释放对象的引用
     * @param id
     */
    ;

    _proto.releaseById = function releaseById(id) {
      // console.log("release", this.name, id);
      var cache = this.objIdStore.get(id);

      if (cache) {
        if (cache.type === 0
        /* Object */
        ) {
            this.objIdStore["delete"](cache.obj);
          } else {
          this.objIdStore["delete"](cache.sym);
        }

        this.objIdStore["delete"](id);
        return true;
      }

      return false;
    };

    _proto.exportSymbol = function exportSymbol(source) {
      var _a;

      return (_a = this.getId(source)) !== null && _a !== void 0 ? _a : this.saveSymId(source);
    };

    _proto.exportObject = function exportObject(source) {
      var _a;

      return (_a = this.getId(source)) !== null && _a !== void 0 ? _a : this.saveObjId(source);
    };

    return ExportStore;
  }();

  var ImportStore = /*#__PURE__*/function () {
    function ImportStore(name) {
      var _this = this;

      this.name = name;
      /**存储协议扩展信息 */

      this.idExtendsStore = new Map();
      /**我所导入的引用对象与符号 */

      this.proxyIdStore = new Map();
      this.proxyIdWM = new WeakMap();
      this._fr = new FinalizationRegistry(function (id) {
        return _this.releaseProxyId(id);
      });
    }
    /**
     * 获取代理对象背后真正的引用信息
     */


    var _proto = ImportStore.prototype;

    _proto.getProxy = function getProxy(proxy) {
      var cache;

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
          var id = this.proxyIdWM.get(proxy);

          if (id !== undefined) {
            cache = this.proxyIdStore.get(id);
          }

          break;
      }

      return cache;
    };

    _proto.isProxy = function isProxy(proxy) {
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
    };

    _proto.getProxyById = function getProxyById(id) {
      var cache = this.proxyIdStore.get(id);
      var res;

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
    ;

    _proto.saveProxyId = function saveProxyId(proxy, id) {
      var cache;

      if (typeof proxy === "symbol") {
        cache = {
          id: id,
          type: 1
          /* Symbol */
          ,
          sym: proxy
        };
        this.proxyIdStore.set(proxy, cache);
      } else {
        cache = {
          id: id,
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
    ;

    _proto.backupProxyId = function backupProxyId(proxy, id) {
      this.proxyIdWM.set(proxy, id);
    }
    /**
     * 释放导入的引用
     * @param id refId
     */
    ;

    _proto.releaseProxyId = function releaseProxyId(id) {
      // console.log("release", this.name, id);
      var cache = this.proxyIdStore.get(id);

      if (cache) {
        this.proxyIdStore["delete"](id);

        if (cache.type === 1
        /* Symbol */
        ) {
            this.proxyIdStore["delete"](cache.sym);
          } else {
          //   this.proxyIdWM.delete(cache.)
          this._fr.unregister(cache.pwr);
        } // 删除缓存的扩展信息


        this.idExtendsStore["delete"](id);

        this._onReleaseCallback(id);

        return true;
      }

      return false;
    };

    _proto._onReleaseCallback = function _onReleaseCallback(id) {
      return;
    }
    /**监听一个引用被释放 */
    ;

    _proto.onRelease = function onRelease(cb) {
      this._onReleaseCallback = cb;
    };

    return ImportStore;
  }(); // export const importStore = new ImportStore();

  function _settle(pact, state, value) {
    if (!pact.s) {
      if (value instanceof _Pact) {
        if (value.s) {
          if (state & 1) {
            state = value.s;
          }

          value = value.v;
        } else {
          value.o = _settle.bind(null, pact, state);
          return;
        }
      }

      if (value && value.then) {
        value.then(_settle.bind(null, pact, state), _settle.bind(null, pact, 2));
        return;
      }

      pact.s = state;
      pact.v = value;
      var observer = pact.o;

      if (observer) {
        observer(pact);
      }
    }
  }

  var _Pact = /*#__PURE__*/function () {
    function _Pact() {}

    _Pact.prototype.then = function (onFulfilled, onRejected) {
      var result = new _Pact();
      var state = this.s;

      if (state) {
        var callback = state & 1 ? onFulfilled : onRejected;

        if (callback) {
          try {
            _settle(result, 1, callback(this.v));
          } catch (e) {
            _settle(result, 2, e);
          }

          return result;
        } else {
          return this;
        }
      }

      this.o = function (_this) {
        try {
          var value = _this.v;

          if (_this.s & 1) {
            _settle(result, 1, onFulfilled ? onFulfilled(value) : value);
          } else if (onRejected) {
            _settle(result, 1, onRejected(value));
          } else {
            _settle(result, 2, value);
          }
        } catch (e) {
          _settle(result, 2, e);
        }
      };

      return result;
    };

    return _Pact;
  }();

  function _isSettledPact(thenable) {
    return thenable instanceof _Pact && thenable.s & 1;
  }

  function _for(test, update, body) {
    var stage;

    for (;;) {
      var shouldContinue = test();

      if (_isSettledPact(shouldContinue)) {
        shouldContinue = shouldContinue.v;
      }

      if (!shouldContinue) {
        return result;
      }

      if (shouldContinue.then) {
        stage = 0;
        break;
      }

      var result = body();

      if (result && result.then) {
        if (_isSettledPact(result)) {
          result = result.s;
        } else {
          stage = 1;
          break;
        }
      }

      if (update) {
        var updateValue = update();

        if (updateValue && updateValue.then && !_isSettledPact(updateValue)) {
          stage = 2;
          break;
        }
      }
    }

    var pact = new _Pact();

    var reject = _settle.bind(null, pact, 2);

    (stage === 0 ? shouldContinue.then(_resumeAfterTest) : stage === 1 ? result.then(_resumeAfterBody) : updateValue.then(_resumeAfterUpdate)).then(void 0, reject);
    return pact;

    function _resumeAfterBody(value) {
      result = value;

      do {
        if (update) {
          updateValue = update();

          if (updateValue && updateValue.then && !_isSettledPact(updateValue)) {
            updateValue.then(_resumeAfterUpdate).then(void 0, reject);
            return;
          }
        }

        shouldContinue = test();

        if (!shouldContinue || _isSettledPact(shouldContinue) && !shouldContinue.v) {
          _settle(pact, 1, result);

          return;
        }

        if (shouldContinue.then) {
          shouldContinue.then(_resumeAfterTest).then(void 0, reject);
          return;
        }

        result = body();

        if (_isSettledPact(result)) {
          result = result.v;
        }
      } while (!result || !result.then);

      result.then(_resumeAfterBody).then(void 0, reject);
    }

    function _resumeAfterTest(shouldContinue) {
      if (shouldContinue) {
        result = body();

        if (result && result.then) {
          result.then(_resumeAfterBody).then(void 0, reject);
        } else {
          _resumeAfterBody(result);
        }
      } else {
        _settle(pact, 1, result);
      }
    }

    function _resumeAfterUpdate() {
      if (shouldContinue = test()) {
        if (shouldContinue.then) {
          shouldContinue.then(_resumeAfterTest).then(void 0, reject);
        } else {
          _resumeAfterTest(shouldContinue);
        }
      } else {
        _settle(pact, 1, result);
      }
    }
  }

  function _catch$1(body, recover) {
    try {
      var result = body();
    } catch (e) {
      return recover(e);
    }

    if (result && result.then) {
      return result.then(void 0, recover);
    }

    return result;
  }

  var ComlinkCore = /*#__PURE__*/function () {
    function ComlinkCore(port, name) {
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

    var _proto = ComlinkCore.prototype;

    _proto.$destroy = function $destroy() {
      throw new Error("Method not implemented.");
    };

    _proto._getInitedExportScope = function _getInitedExportScope() {
      var _exportModule = this._exportModule;

      if (_exportModule.isExported === false) {
        _exportModule.isExported = true;
        this.exportStore.exportObject(_exportModule.scope);
      }

      return _exportModule.scope;
    };

    _proto["export"] = function _export(source, name) {
      if (name === void 0) {
        name = "default";
      }

      Reflect.set(this._getInitedExportScope(), name, source);
    };

    _proto.$getEsmReflectHanlder = function $getEsmReflectHanlder(operator) {
      var handler = ESM_REFLECT_FUN_MAP.get(operator);

      if (!handler) {
        throw new SyntaxError("no support operator:" + operator);
      }

      return handler;
    };

    _proto._listen = function _listen() {
      var _this2 = this;

      var _this = this;

      var exportStore = this.exportStore,
          port = this.port;
      port.onMessage(function (cb, bin) {
        try {
          var _exit2;

          var _temp9 = function _temp9(_result) {
            if (_exit2) return _result;
            out_void();
          };

          var out_void = function out_void() {
            return resolveCallback(cb, undefined);
          };

          var linkObj = _this.transfer.transferableBinary2LinkObj(bin);

          var _temp10 = function () {
            if (linkObj.type === 2
            /* In */
            ) {
              var obj = exportStore.getObjById(linkObj.targetId);

              if (obj === undefined) {
                throw new ReferenceError("no found");
              }
              /**预备好结果 */


              var linkOut = {
                type: 3
                /* Out */
                ,
                // resId: linkObj.reqId,
                out: [],
                isThrow: false
              };

              var out_linkOut = function out_linkOut(anyRes) {
                _this.transfer.Any2InOutBinary(function (iobRet) {
                  if (iobRet.isError) {
                    return cb(iobRet);
                  }

                  linkOut.out.push(iobRet.data);
                  resolveCallback(cb, _this.transfer.linkObj2TransferableBinary(linkOut));
                }, anyRes);
              };

              return _catch$1(function () {
                function _temp6() {
                  if (linkObj.hasOut) {
                    _exit2 = 1;
                    return out_linkOut(res);
                  } else {
                    _exit2 = 1;
                    return out_void();
                  }
                }

                var res;
                /**JS语言中，this对象不用传输。
                 * 但在Comlink协议中，它必须传输：
                 * 因为我们使用call/apply模拟，所以所有所需的对象都需要传递进来
                 */

                var operator = _this.transfer.InOutBinary2Any(linkObj["in"][0]);

                var paramList = linkObj["in"].slice(1).map(function (iob) {
                  return _this.transfer.InOutBinary2Any(iob);
                });

                var _temp5 = function () {
                  if (18
                  /* Multi */
                  === operator) {
                    /// 批量操作
                    res = obj;
                    var _i = 0;

                    var _temp11 = _for(function () {
                      return _i < paramList.length;
                    }, void 0, function () {
                      function _temp2() {
                        _i += len + 1;
                      }

                      var len = paramList[_i];
                      var $operator = paramList[_i + 1];
                      var $paramList = paramList.slice(_i + 2, _i + 1 + len);

                      var $handler = _this.$getEsmReflectHanlder($operator);

                      res = $handler.fun(res, $paramList);

                      var _temp = function () {
                        if ($handler.type === "async") {
                          return Promise.resolve(res).then(function (_res) {
                            res = _res;
                          });
                        }
                      }();

                      return _temp && _temp.then ? _temp.then(_temp2) : _temp2(_temp);
                    });

                    if (_temp11 && _temp11.then) return _temp11.then(function () {});
                  } else {
                    /// 单项操作
                    var handler = _this.$getEsmReflectHanlder(operator);

                    res = handler.fun(obj, paramList);

                    var _temp12 = function () {
                      if (handler.type === "async") {
                        return Promise.resolve(res).then(function (_res2) {
                          res = _res2;
                        });
                      }
                    }();

                    if (_temp12 && _temp12.then) return _temp12.then(function () {});
                  }
                }();

                return _temp5 && _temp5.then ? _temp5.then(_temp6) : _temp6(_temp5); /// 如果有返回结果的需要，那么就尝试进行返回
              }, function (err) {
                linkOut.isThrow = true;
                _exit2 = 1;
                return out_linkOut(err);
              });
            } else if (linkObj.type === 0
            /* Import */
            ) {
                var scope = _this._getInitedExportScope();

                _exit2 = 1;
                return _this.transfer.Any2InOutBinary(function (scopeRet) {
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
          }();

          return Promise.resolve(_temp10 && _temp10.then ? _temp10.then(_temp9) : _temp9(_temp10));
        } catch (e) {
          return Promise.reject(e);
        }
      });
      this.importStore.onRelease(function (refId) {
        // console.log("send release", refId);
        port.send(_this2.transfer.linkObj2TransferableBinary({
          type: 4
          /* Release */
          ,
          locId: refId
        }));
      });
    };

    _proto.$getImportModule = function $getImportModule(output) {
      var _this3 = this;

      var port = this.port;
      /**
       * 进行协商握手，取得对应的 refId
       * @TODO 这里将会扩展出各类语言的传输协议
       */

      if (this._importModule === undefined) {
        port.req(SyncPiperFactory(output, function (ret) {
          var bin = OpenArg(ret);

          var linkObj = _this3.transfer.transferableBinary2LinkObj(bin);

          if (linkObj.type !== 1
          /* Export */
          ) {
              throw new TypeError();
            } /// 握手完成，转成代理对象


          return _this3._importModule = _this3.transfer.InOutBinary2Any(linkObj.module);
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
    };

    return ComlinkCore;
  }();

  var IOB_EFT_Factory_Map = new Map([[2
  /* Sync */
  , {
    factory: Function,
    toString: function toString(refExtends) {
      return "function " + refExtends.name + "() { [remote code] }";
    }
  }]]);

  for (var _i = 0, _arr = [[3
  /* SyncGenerator */
  , {
    factoryCode: "return function* () {}.constructor",
    toString: function toString(refExtends) {
      return "function *" + refExtends.name + "() { [remote code] }";
    }
  }], [4
  /* Async */
  , {
    factoryCode: "return async function () {}.constructor",
    toString: function toString(refExtends) {
      return "async function " + refExtends.name + "() { [remote code] }";
    }
  }], [5
  /* AsyncGenerator */
  , {
    factoryCode: "return async function* () {}.constructor",
    toString: function toString(refExtends) {
      return "async function *" + refExtends.name + "() { [remote code] }";
    }
  }], [8
  /* Class */
  , {
    factoryCode: "return ()=>class {}",
    toString: function toString(refExtends) {
      return "class " + refExtends.name + " { [remote code] }";
    }
  }]]; _i < _arr.length; _i++) {
    var _arr$_i = _arr[_i],
        funType = _arr$_i[0],
        _arr$_i$ = _arr$_i[1],
        factoryCode = _arr$_i$.factoryCode,
        _toString = _arr$_i$.toString;
    var factory = void 0;

    try {
      factory = Function(factoryCode)();
    } catch (_unused) {
      factory = Function;
    }

    IOB_EFT_Factory_Map.set(funType, {
      factory: factory,
      toString: _toString
    });
  }

  function getFunctionType(fun) {
    var ctor = fun.constructor;

    if (ctor) {
      var ctorName = ctor.name;

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

    var str = Object.toString.call(fun);

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

  var EXPORT_FUN_DESCRIPTOR_SYMBOL = Symbol("function.export");
  /**获取一个对象的描述信息 */

  function getFunctionExportDescription(fun) {
    return Reflect.get(fun, EXPORT_FUN_DESCRIPTOR_SYMBOL) || {};
  }
  /**导入者 缓存一个 function 的导入信息 */

  var IMPORT_FUN_EXTENDS_SYMBOL = Symbol("function.import");
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

      var refExtends = Reflect.get(this, IMPORT_FUN_EXTENDS_SYMBOL);
      var toString = refExtends.toString;

      if (toString.mode === 1
      /* static */
      ) {
          return toString.code;
        }

      throw new TypeError();
    }

    var self = toString;
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

  var globalSymbolStore = new Map();
  ["asyncIterator", "hasInstance", "isConcatSpreadable", "iterator", "match", "matchAll", "replace", "search", "species", "split", "toPrimitive", "toStringTag", "unscopables"].forEach(function (name) {
    var sym = Reflect.get(Symbol, name);

    if (typeof sym === "symbol") {
      var cache = {
        sym: sym,
        name: name
      };
      globalSymbolStore.set(sym, cache);
      globalSymbolStore.set(name, cache);
    }
  }); //#endregion

  var ModelTransfer = /*#__PURE__*/function () {
    function ModelTransfer(core) {
      this.core = core;
    }

    var _proto = ModelTransfer.prototype;

    _proto.canClone = function canClone(obj) {
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
    ;

    _proto._getRemoteSymbolItemExtends = function _getRemoteSymbolItemExtends(sym) {
      var _a, _b;

      var globalSymInfo = globalSymbolStore.get(sym);

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
    ;

    _proto._getRefItemExtends = function _getRefItemExtends(obj) {
      if (typeof obj === "object") {
        return {
          type: 1
          /* Object */
          ,
          status: getObjectStatus(obj)
        };
      }

      if (typeof obj === "function") {
        var exportDescriptor = getFunctionExportDescription(obj);
        var funType = getFunctionType(obj);
        /**
         * @FIXME 这种判断也是有风险的，因为虽然箭头函数等严格模式不允许执行 `fun.caller = 1`，但因为`caller`并不在属性里，而是在原型链上进行约束的，所以可能会使用`Reflect.set(fun,'caller',1)`从而达成混淆的效果
         */

        var isStatic = Object.getOwnPropertyDescriptor(obj, "caller") === undefined;
        return {
          type: 0
          /* Function */
          ,
          funType: funType,
          name: obj.name,
          length: obj.length,
          isStatic: isStatic,
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
    };

    _proto.Any2InOutBinary = function Any2InOutBinary(cb, obj) {
      var _this = this;

      SyncForCallback(cb, function () {
        var needClone = _this.canClone(obj);

        var item; /// 可直接通过赋值而克隆的对象

        if (needClone) {
          item = {
            type: 0
            /* Clone */
            ,
            data: obj
          };
        } else {
          /// 对象是否是导入进来的
          var imp = _this.core.importStore.getProxy(obj);

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
                    refId: _this.core.exportStore.exportSymbol(obj),
                    "extends": _this._getRemoteSymbolItemExtends(obj)
                  };
                  break;

                case "function":
                case "object":
                  if (obj !== null) {
                    item = {
                      type: 2
                      /* Ref */
                      ,
                      refId: _this.core.exportStore.exportObject(obj),
                      "extends": _this._getRefItemExtends(obj)
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
    };

    _proto.linkObj2TransferableBinary = function linkObj2TransferableBinary(obj) {
      return obj;
    };

    _proto.transferableBinary2LinkObj = function transferableBinary2LinkObj(bin) {
      return bin;
    };

    return ModelTransfer;
  }();

  var CB_TO_SYNC_ERROR = new SyntaxError("could not transfrom to sync function");
  function CallbackToSync(cbCaller, args, ctx) {
    var ret = {
      isError: true,
      error: CB_TO_SYNC_ERROR
    };
    cbCaller.call.apply(cbCaller, [ctx, function (_ret) {
      return ret = _ret;
    }].concat(args));
    return OpenArg(ret);
  }

  var IS_ASYNC_APPLY_FUN_MARKER = Symbol("asyncApplyFun");
  var IS_SYNC_APPLY_FUN_MARKER = Symbol("syncApplyFun");
  var PROTOCAL_SENDER = Symbol("protocalSender");

  var SENDER_MARKER = Symbol("linkInSender");
  var SyncModelTransfer = /*#__PURE__*/function (_ModelTransfer) {
    _inheritsLoose(SyncModelTransfer, _ModelTransfer);

    function SyncModelTransfer(core) {
      var _this;

      _this = _ModelTransfer.call(this, core) || this;
      /**
       * ref fun statis toString
       */

      _this._rfsts = refFunctionStaticToStringFactory();
      return _this;
    }

    var _proto = SyncModelTransfer.prototype;

    _proto._genLinkInSender = function _genLinkInSender(port, refId) {
      var _this2 = this;

      var req = function req(linkIn) {
        return _this2._reqLinkIn(port, refId, linkIn);
      };

      var send = function send(linkIn) {
        return _this2._sendLinkIn(port, refId, linkIn);
      };

      return {
        __marker__: SENDER_MARKER,
        send: send,
        req: req
      };
    };

    _proto._getDefaultProxyHanlder = function _getDefaultProxyHanlder(sender) {
      var proxyHandler = {
        getPrototypeOf: function getPrototypeOf(_target) {
          return sender.req([0
          /* GetPrototypeOf */
          ]);
        },
        setPrototypeOf: function setPrototypeOf(_target, proto) {
          return sender.req([1
          /* SetPrototypeOf */
          , proto]);
        },
        isExtensible: function isExtensible(target) {
          return sender.req([2
          /* IsExtensible */
          ]);
        },
        preventExtensions: function preventExtensions(_target) {
          return sender.req([3
          /* PreventExtensions */
          ]);
        },
        getOwnPropertyDescriptor: function getOwnPropertyDescriptor(_target, prop) {
          return sender.req([4
          /* GetOwnPropertyDescriptor */
          , prop]);
        },
        has: function has(_target, prop) {
          return sender.req([5
          /* Has */
          ]);
        },

        /**导入子模块 */
        get: function get(_target, prop, _reciver) {
          return (// console.log("get", prop),
            sender.req([6
            /* Get */
            , prop])
          );
        },

        /**发送 set 操作 */
        set: function set(_target, prop, value, _receiver) {
          return sender.req([7
          /* Set */
          , prop, value]);
        },
        deleteProperty: function deleteProperty(_target, prop) {
          return sender.req([8
          /* DeleteProperty */
          , prop]);
        },
        defineProperty: function defineProperty(_target, prop, attr) {
          return sender.req([9
          /* DefineProperty */
          , prop, attr]);
        },
        ownKeys: function ownKeys(_target) {
          return sender.req([10
          /* OwnKeys */
          ]);
        },
        apply: function apply(_target, thisArg, argArray) {
          return sender.req([11
          /* Apply */
          , thisArg].concat(argArray));
        },
        construct: function construct(_target, argArray, newTarget) {
          return sender.req([12
          /* Construct */
          , newTarget].concat(argArray));
        }
      };
      return proxyHandler;
    }
    /**打包指令 */
    ;

    _proto._pkgLinkIn = function _pkgLinkIn(targetId, linkIn, hasOut) {
      var transfer = this.core.transfer;
      return transfer.linkObj2TransferableBinary({
        type: 2
        /* In */
        ,
        // reqId,
        targetId: targetId,
        "in": linkIn.map(function (a) {
          return CallbackToSync(transfer.Any2InOutBinary, [a], transfer);
        }),
        hasOut: hasOut
      });
    };

    _proto._reqLinkIn = function _reqLinkIn(port, targetId, linkIn) {
      var transfer = this.core.transfer;

      var tb = this._pkgLinkIn(targetId, linkIn, true); /// 执行请求


      var bin = CallbackToSync(port.req, [tb], port); /// 处理请求

      var linkObj = transfer.transferableBinary2LinkObj(bin);

      if (linkObj.type !== 3
      /* Out */
      ) {
          throw new TypeError();
        }

      if (linkObj.isThrow) {
        var err_iob = linkObj.out.slice().pop();
        var err = err_iob && transfer.InOutBinary2Any(err_iob);
        throw err;
      }

      var res_iob = linkObj.out.slice().pop();
      var res = res_iob && transfer.InOutBinary2Any(res_iob);
      return res;
    };

    _proto._sendLinkIn = function _sendLinkIn(port, targetId, linkIn) {
      var transfer = this.core.transfer;
      var tb = transfer.linkObj2TransferableBinary({
        type: 2
        /* In */
        ,
        // reqId,
        targetId: targetId,
        "in": linkIn.map(function (a) {
          return CallbackToSync(transfer.Any2InOutBinary, [a], transfer);
        }),
        hasOut: false
      });
      port.send(tb);
    }
    /**
     * 主动生成引用代理
     * @param port
     * @param refId
     */
    ;

    _proto._createImportByRefId = function _createImportByRefId(port, refId) {
      var refHook = this._createImportRefHook(port, refId);

      var source = refHook.getSource();

      if (refHook.type === "object") {
        var proxyHanlder = refHook.getProxyHanlder();
        var proxy = new Proxy(source, proxyHanlder);
        return proxy;
      }

      return source;
    };

    _proto.getLinkInSenderByProxy = function getLinkInSenderByProxy(obj) {
      if (obj) {
        var sender = obj[PROTOCAL_SENDER];

        if (sender.__marker__ === SENDER_MARKER) {
          return sender;
        }
      }
    };

    _proto._createImportRefHook = function _createImportRefHook(port, refId) {
      var _this3 = this;

      var refExtends = this.core.importStore.idExtendsStore.get(refId);

      if (!refExtends) {
        throw new ReferenceError();
      }

      var ref;

      if (refExtends.type === 0
      /* Function */
      ) {
          var factory = IOB_EFT_Factory_Map.get(refExtends.funType);

          if (!factory) {
            throw new TypeError();
          }

          var sourceFun = factory.factory();
          var funRef = {
            type: "object",
            getSource: function getSource() {
              return sourceFun;
            },
            getProxyHanlder: function getProxyHanlder() {
              var sender = _this3._genLinkInSender(port, refId);

              var defaultProxyHanlder = _this3._getDefaultProxyHanlder(sender);

              var functionProxyHanlder = _extends({}, defaultProxyHanlder, {
                get: function get(target, prop, receiver) {
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
                      return _this3._rfsts;
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
          var sourceObj = {};
          var objRef = {
            type: "object",
            getSource: function getSource() {
              return sourceObj;
            },
            getProxyHanlder: function getProxyHanlder() {
              var sender = _this3._genLinkInSender(port, refId);

              var defaultProxyHanlder = _this3._getDefaultProxyHanlder(sender);
              /**
               * 因为对象一旦被设置状态后，无法回退，所以这里可以直接根据现有的状态来判断对象的可操作性
               * @TODO 使用isExtensible isFrozen isSealed来改进
               */


              var functionProxyHanlder = _extends({}, defaultProxyHanlder, {
                get: function get(target, prop, receiver) {
                  //#region 自定义属性
                  if (prop === PROTOCAL_SENDER) {
                    return sender;
                  } //#endregion


                  return defaultProxyHanlder.get(target, prop, receiver);
                },
                set: function set(target, prop, value, receiver) {
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
                deleteProperty: function deleteProperty(target, prop) {
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
          var sourceSym;

          if (refExtends.global) {
            var globalSymInfo = globalSymbolStore.get(refExtends.description);

            if (!globalSymInfo) {
              throw new TypeError();
            }

            sourceSym = globalSymInfo.sym;
          } else {
            sourceSym = refExtends.unique ? Symbol["for"](refExtends.description) : Symbol(refExtends.description);
          }

          var symRef = {
            type: "primitive",
            getSource: function getSource() {
              return sourceSym;
            }
          };
          ref = symRef;
        }

      if (!ref) {
        throw new TypeError();
      }

      return ref;
    };

    _proto.InOutBinary2Any = function InOutBinary2Any(bin) {
      var _this$core = this.core,
          port = _this$core.port,
          importStore = _this$core.importStore,
          exportStore = _this$core.exportStore;

      switch (bin.type) {
        //   case LinkItemType.Default:
        //     return defaultCtx;
        case 3
        /* Locale */
        :
          var loc = exportStore.getObjById(bin.locId) || exportStore.getSymById(bin.locId);

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
          var cachedProxy = importStore.getProxyById(bin.refId);

          if (cachedProxy === undefined) {
            // 保存引用信息
            importStore.idExtendsStore.set(bin.refId, bin["extends"]); /// 使用导入功能生成对象

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
    };

    return SyncModelTransfer;
  }(ModelTransfer);

  var ComlinkSync = /*#__PURE__*/function (_ComlinkCore) {
    _inheritsLoose(ComlinkSync, _ComlinkCore);

    function ComlinkSync(port, name) {
      var _this;

      _this = _ComlinkCore.call(this, port, name) || this;
      _this.transfer = new SyncModelTransfer(_assertThisInitialized(_this));
      _this._syncWM = new WeakMap();
      _this._asyncWM = new WeakMap();
      return _this;
    } // /**
    //  * ref fun statis toString
    //  */
    // private _rfsts = refFunctionStaticToStringFactory();


    var _proto = ComlinkSync.prototype;

    _proto.$getEsmReflectHanlder = function $getEsmReflectHanlder(opeartor) {
      var hanlder = _ComlinkCore.prototype.$getEsmReflectHanlder.call(this, opeartor);

      if (opeartor === 11
      /* Apply */
      || opeartor === 19
      /* SyncApply */
      ) {
          var applyHanlder = function applyHanlder(target, args) {
            if (target === Function.prototype.toString) {
              var ctx = args[0];
              var exportDescriptor = getFunctionExportDescription(ctx); /// 保护源码

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
    };

    _proto["import"] = function _import(key) {
      if (key === void 0) {
        key = "default";
      }

      var importModule = CallbackToSync(this.$getImportModule, [], this);
      return Reflect.get(importModule, key);
    };

    _proto.importAsSync = function importAsSync(key) {
      if (key === void 0) {
        key = "default";
      }

      return this.asyncToSync(this["import"](key));
    };

    _proto.asyncToSync = function asyncToSync(fun) {
      if (typeof fun !== "function") {
        throw new TypeError();
      }

      if (Reflect.get(fun, IS_ASYNC_APPLY_FUN_MARKER)) {
        return fun;
      }

      var syncFun = this._syncWM.get(fun);

      if (!syncFun) {
        var sender = this.transfer.getLinkInSenderByProxy(fun);

        if (!sender) {
          throw new TypeError();
        }

        syncFun = new Proxy(fun, {
          get: function get(_target, prop, r) {
            if (prop === IS_ASYNC_APPLY_FUN_MARKER) {
              return true;
            }

            return Reflect.get(fun, prop, r);
          },
          apply: function apply(_target, thisArg, argArray) {
            return sender.req([19
            /* SyncApply */
            , thisArg].concat(argArray));
          }
        });
        this.importStore.backupProxyId(syncFun, this.importStore.getProxy(fun).id);

        this._syncWM.set(fun, syncFun);
      }

      return syncFun;
    };

    _proto.importAsAsync = function importAsAsync(key) {
      if (key === void 0) {
        key = "default";
      }

      return this.syncToAsync(this["import"](key));
    };

    _proto.syncToAsync = function syncToAsync(fun) {
      if (typeof fun !== "function") {
        throw new TypeError();
      }

      if (Reflect.get(fun, IS_SYNC_APPLY_FUN_MARKER)) {
        return fun;
      }

      var asyncFun = this._asyncWM.get(fun);

      if (!asyncFun) {
        var sender = this.transfer.getLinkInSenderByProxy(fun);

        if (!sender) {
          throw new TypeError();
        }

        asyncFun = new Proxy(fun, {
          get: function get(_target, prop, r) {
            if (prop === IS_SYNC_APPLY_FUN_MARKER) {
              return true;
            }

            return Reflect.get(fun, prop, r);
          },
          apply: function apply(_target, thisArg, argArray) {
            /// 要使用本地的promise对任务进行包裹，不然对方接下来会进入卡死状态。
            return new Promise(function (resolve, reject) {
              /* 无需返回值，所以走 .send ，这个是异步的，不会造成阻塞 */
              sender.send([20
              /* AsyncApply */
              , resolve, reject, thisArg].concat(argArray));
            });
          }
        });
        this.importStore.backupProxyId(asyncFun, this.importStore.getProxy(fun).id);

        this._asyncWM.set(fun, asyncFun);
      }

      return asyncFun;
    };

    return ComlinkSync;
  }(ComlinkCore);

  function bindThis(target, propertyKey, descriptor) {
    if (!descriptor || typeof descriptor.value !== "function") {
      throw new TypeError("Only methods can be decorated with @bind. <" + propertyKey + "> is not a method!");
    }

    return {
      configurable: true,
      get: function get() {
        var bound = descriptor.value.bind(this);
        Object.defineProperty(this, propertyKey, {
          value: bound,
          configurable: true,
          writable: true
        });
        return bound;
      }
    };
  }

  var CACHE_KEYS_SYMBOL = Symbol("CACHE_GETTER_KEYS_STORE");

  function getCacheKeys(protoTarget) {
    var CACHE_KEYS = Reflect.get(protoTarget, CACHE_KEYS_SYMBOL);

    if (!CACHE_KEYS) {
      CACHE_KEYS = new Map();
      Reflect.set(protoTarget, CACHE_KEYS_SYMBOL, CACHE_KEYS);
    }

    return CACHE_KEYS;
  }

  function keyGenerator(protoTarget, prop) {
    var CACHE_KEYS = getCacheKeys(protoTarget);
    var symbol = CACHE_KEYS.get(prop);

    if (!symbol) {
      symbol = Symbol("[" + typeof prop + "]" + String(prop));
      CACHE_KEYS.set(prop, symbol);
    }

    return symbol;
  }

  function cacheGetter(propTarget, prop, descriptor) {
    if (typeof descriptor.get !== "function") {
      throw new TypeError("property " + String(prop) + " must has an getter function.");
    }

    var source_fun = descriptor.get;
    var CACHE_VALUE_SYMBOL = keyGenerator(propTarget, prop);

    var getter = function getter() {
      if (CACHE_VALUE_SYMBOL in this) {
        return this[CACHE_VALUE_SYMBOL].value;
      } else {
        var value = source_fun.call(this);
        var cacheValue = {
          target: this,
          value: value,
          sourceFun: source_fun
        };
        this[CACHE_VALUE_SYMBOL] = cacheValue;

        if (descriptor.set === undefined) {
          try {
            Object.defineProperty(this, prop, {
              value: value,
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
    var CACHE_KEYS = getCacheKeys(target);

    if (CACHE_KEYS.has(prop) === false) {
      return true;
    }

    var CACHE_VALUE_SYMBOL = CACHE_KEYS.get(prop);
    return _cleanGetterCache(target, prop, CACHE_VALUE_SYMBOL);
  }
  function cleanAllGetterCache(target) {
    var CACHE_KEYS = getCacheKeys(target);

    for (var _iterator = _createForOfIteratorHelperLoose(CACHE_KEYS), _step; !(_step = _iterator()).done;) {
      var _step$value = _step.value,
          prop = _step$value[0],
          symbol = _step$value[1];

      _cleanGetterCache(target, prop, symbol);
    }
  }

  function _cleanGetterCache(target, prop, CACHE_VALUE_SYMBOL) {
    var cacheValue = Reflect.get(target, CACHE_VALUE_SYMBOL);

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
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) {
      if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    }
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };

  var __metadata = undefined && undefined.__metadata || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
  };
  var PropArrayHelper = /*#__PURE__*/function () {
    function PropArrayHelper(pid) {
      if (pid === void 0) {
        pid = Math.random().toString(36).substr(2);
      }

      this.pid = pid;
      this.CLASS_PROTO_ARRAYDATA_POOL = new Map();
      this.PA_ID_KEY = Symbol("@PAID:" + this.pid);
      this.PA_ID_VALUE = 0;
    }

    var _proto = PropArrayHelper.prototype;

    _proto.get = function get(target, key) {
      var res = new Set();
      var CLASS_PROTO_ARRAYDATA = this.CLASS_PROTO_ARRAYDATA_POOL.get(key);

      if (CLASS_PROTO_ARRAYDATA) {
        do {
          if (target.hasOwnProperty(this.PA_ID_KEY)) {
            var arr_data = CLASS_PROTO_ARRAYDATA.get(target[this.PA_ID_KEY]);

            if (arr_data) {
              for (var _iterator = _createForOfIteratorHelperLoose(arr_data), _step; !(_step = _iterator()).done;) {
                var item = _step.value;
                res.add(item);
              }
            }
          }
        } while (target = Object.getPrototypeOf(target));
      }

      return res;
    };

    _proto.add = function add(target, key, value) {
      var CLASS_PROTO_ARRAYDATA = this.CLASS_PROTO_ARRAYDATA_POOL.get(key);

      if (!CLASS_PROTO_ARRAYDATA) {
        CLASS_PROTO_ARRAYDATA = new Map();
        this.CLASS_PROTO_ARRAYDATA_POOL.set(key, CLASS_PROTO_ARRAYDATA);
      }

      var pa_id = target.hasOwnProperty(this.PA_ID_KEY) ? target[this.PA_ID_KEY] : target[this.PA_ID_KEY] = Symbol("@PAID:" + this.pid + "#" + this.PA_ID_VALUE++);
      var arr_data = CLASS_PROTO_ARRAYDATA.get(pa_id);

      if (!arr_data) {
        arr_data = [value];
        CLASS_PROTO_ARRAYDATA.set(pa_id, arr_data);
      } else {
        arr_data.push(value);
      }
    };

    _proto.remove = function remove(target, key, value) {
      var CLASS_PROTO_ARRAYDATA = this.CLASS_PROTO_ARRAYDATA_POOL.get(key);

      if (!CLASS_PROTO_ARRAYDATA) {
        return;
      }

      do {
        if (!target.hasOwnProperty(this.PA_ID_KEY)) {
          break;
        }

        var pa_id = target[this.PA_ID_KEY];
        var arr_data = CLASS_PROTO_ARRAYDATA.get(pa_id);

        if (!arr_data) {
          return;
        }

        var index = arr_data.indexOf(value);

        if (index !== -1) {
          arr_data.splice(index, 1);
          return;
        }
      } while (target = Object.getPrototypeOf(target));
    };

    return PropArrayHelper;
  }();

  __decorate([bindThis, __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], PropArrayHelper.prototype, "get", null);

  __decorate([bindThis, __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object, Object]), __metadata("design:returntype", void 0)], PropArrayHelper.prototype, "add", null);

  __decorate([bindThis, __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object, Object]), __metadata("design:returntype", void 0)], PropArrayHelper.prototype, "remove", null);

  var THROTTLE_WRAP_PLOT;

  (function (THROTTLE_WRAP_PLOT) {
    THROTTLE_WRAP_PLOT[THROTTLE_WRAP_PLOT["WAIT_RESULT_RETURN"] = 0] = "WAIT_RESULT_RETURN";
    THROTTLE_WRAP_PLOT[THROTTLE_WRAP_PLOT["NO_WAIT_EXEC_TIME"] = 1] = "NO_WAIT_EXEC_TIME";
  })(THROTTLE_WRAP_PLOT || (THROTTLE_WRAP_PLOT = {}));

  var NO_ALLOW_PROP = new Set([Symbol.toPrimitive, Symbol.toStringTag, Symbol.hasInstance, Symbol.species, /// 不能直接支持Symbol.iterator，只能用Symbol.asyncIterator来替代Symbol.iterator
  Symbol.iterator, // Symbol.asyncIterator,
  Symbol.isConcatSpreadable, Symbol.match, Symbol.matchAll, Symbol.replace, Symbol.search, Symbol.split]);

  var __THEN_DISABLED__ = new WeakSet();

  function createHolderProxyHanlder(holderReflect) {
    var proxyHanlder = {
      getPrototypeOf: function getPrototypeOf() {
        return null;
      },
      setPrototypeOf: function setPrototypeOf() {
        throw new Error("no support AsyncReflect.setPrototypeOf"); // return false;
      },
      isExtensible: function isExtensible() {
        throw new Error("no support AsyncReflect.isExtensible");
      },
      preventExtensions: function preventExtensions() {
        throw new Error("no support AsyncReflect.preventExtensions");
      },
      getOwnPropertyDescriptor: function getOwnPropertyDescriptor() {
        throw new Error("no support AsyncReflect.getOwnPropertyDescriptor");
      },
      defineProperty: function defineProperty() {
        throw new Error("no support AsyncReflect.defineProperty");
      },
      ownKeys: function ownKeys() {
        throw new Error("no support AsyncReflect.ownKeys");
      },
      has: function has() {
        throw new Error("no support AsyncReflect.has");
      },

      /**导入子模块 */
      get: function get(_target, prop, r) {
        // 禁止支持一些特定的symbol
        if (NO_ALLOW_PROP.has(prop)) {
          return;
        }

        if (prop === "then") {
          /// 一次性
          if (__THEN_DISABLED__["delete"](holderReflect)) {
            return;
          }

          return function (resolve, reject) {
            holderReflect.toValueSync(function (ret) {
              if (ret.isError) {
                return reject(ret.error);
              }

              if (isHolder(ret.data)) {
                /// 如果是一个远端对象
                var thenFun = holderReflect.assetHolder("then");
                thenFun.Operator_typeOfHolder().toValueSync(function (typeNameRet) {
                  if (typeNameRet.isError) {
                    return reject(typeNameRet.error);
                  }

                  if (typeNameRet.data === "function") {
                    thenFun.applyHolder(holderReflect.toHolder(), [resolve, reject]).toValueSync(function () {// 这个promise没人捕捉，也不需要捕捉
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
          return /*#__PURE__*/_wrapAsyncGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
            return regeneratorRuntime.wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    _context.next = 2;
                    return _awaitAsyncGenerator(holderReflect.has(Symbol.asyncIterator));

                  case 2:
                    if (!_context.sent) {
                      _context.next = 6;
                      break;
                    }

                    return _context.delegateYield(_asyncGeneratorDelegate(_asyncIterator(holderReflect.asyncIterator()), _awaitAsyncGenerator), "t0", 4);

                  case 4:
                    _context.next = 7;
                    break;

                  case 6:
                    return _context.delegateYield(_asyncGeneratorDelegate(_asyncIterator(holderReflect.iterator()), _awaitAsyncGenerator), "t1", 7);

                  case 7:
                  case "end":
                    return _context.stop();
                }
              }
            }, _callee);
          }));
        }

        return holderReflect.assetHolder(prop).toAsyncValue();
      },

      /**发送 set 操作 */
      set: function set(_target, prop, value, receiver) {
        var setHolderReflect = holderReflect.setHolder(prop, value);
        var res = true;
        setHolderReflect.toValueSync(function (ret) {
          if (ret.isError === false) {
            res = ret.data;
          }
        });
        return res;
      },
      deleteProperty: function deleteProperty(target, prop) {
        var setHolderReflect = holderReflect.deletePropertyHolder(prop);
        var res = true;
        setHolderReflect.toValueSync(function (ret) {
          if (ret.isError === false) {
            res = ret.data;
          }
        });
        return res;
      },
      apply: function apply(_target, thisArg, argArray) {
        var applyHolderReflect = holderReflect.applyHolder(thisArg, argArray);
        applyHolderReflect.toValueSync(function () {///强行调取触发指令发送
        });
        return applyHolderReflect.toAsyncValue();
      },
      construct: function construct(_target, argArray, newTarget) {
        var constructHolderReflect = holderReflect.constructHolder(argArray, newTarget);
        constructHolderReflect.toValueSync(function () {///强行调取触发指令发送
        });
        return constructHolderReflect.toAsyncValue();
      }
    };
    return proxyHanlder;
  }

  var __HOLDER_REFLECT_WM__ = new WeakMap();

  var __REFLECT_HOLDER_WM__ = new WeakMap();

  function getHolder(holderReflect) {
    var holder = __REFLECT_HOLDER_WM__.get(holderReflect);

    if (holder === undefined) {
      holder = new Proxy(Function("return function " + holderReflect.name + "(){}")(), createHolderProxyHanlder(holderReflect));

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
    var syncRet; /// 默认是同步模式

    var syncResolve = function syncResolve(data) {
      syncRet = {
        isError: false,
        data: data
      };
    };

    var syncReject = function syncReject(error) {
      syncRet = {
        isError: true,
        error: error
      };
    };

    try {
      /// 执行，并尝试同步
      cbCaller.call.apply(cbCaller, [ctx, function (ret) {
        if (ret.isError) {
          syncReject(ret.error);
        } else {
          syncResolve(ret.data);
        }
      }].concat(args));
    } catch (err) {
      syncReject(err);
    } /// 得到及时的响应，直接返回


    if (syncRet !== undefined) {
      return OpenArg(syncRet);
    } /// 没有得到及时的响应，进入异步模式


    return new Promise(function (resolve, reject) {
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
    return function () {
      return CallbackToAsync(cbCaller, [].slice.call(arguments), ctx);
    };
  }
  function isNil(value) {
    return value === undefined || value === null;
  }

  var ReflectForbidenMethods = /*#__PURE__*/function () {
    function ReflectForbidenMethods() {
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

    var _proto = ReflectForbidenMethods.prototype;

    _proto._factory = function _factory(method, errorMessage) {
      return Function("return function " + method + "Forbiden(){throw new TypeError(`" + errorMessage + "`)}");
    };

    _proto._factory_NoObject = function _factory_NoObject(method) {
      return this._factory(method, "Reflect." + method + " called on non-object(${this.name})");
    };

    return ReflectForbidenMethods;
  }();

  var __decorate$1 = undefined && undefined.__decorate || function (decorators, target, key, desc) {
    var c = arguments.length,
        r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
        d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) {
      if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    }
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };

  var __metadata$1 = undefined && undefined.__metadata || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
  };
  var ID_ACC = 0; //#region 一些辅助性函数

  var reflectForbidenMethods = new ReflectForbidenMethods();
  var refFunctionStaticToString = refFunctionStaticToStringFactory();
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
    throw new TypeError("unknown iobCacher type: " + iobCacher);
  } //#endregion


  var HolderReflect = /*#__PURE__*/function () {
    function HolderReflect(linkSenderArgs, // public linkInSender: <R>(
    //   linkIn: readonly [EmscriptenReflect, ...unknown[]],
    //   hasOut?: BFChainComlink.HolderReflect<R> | false,
    // ) => unknown,
    core) {
      this.linkSenderArgs = linkSenderArgs;
      this.core = core;
      this.id = ID_ACC++;
      this.name = "holder_" + this.id;
      this.staticMode = true;
    }

    var _proto = HolderReflect.prototype;

    _proto.toHolder = function toHolder() {
      return getHolder(this);
    } //#region Holder特有接口
    ;

    _proto.toValueSync = function toValueSync(cb) {
      var _this3 = this;

      var iobCacher = this._iobCacher;
      var needSend = false;

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
          iobCacher.waitter.push(function (ret) {
            try {
              OpenArg(ret);
              iobCacher = _this3._iobCacher;

              if (!iobCacher || iobCacher.type === 0
              /* WAITING */
              ) {
                  throw new TypeError();
                }

              _this3.toValueSync(cb);
            } catch (error) {
              cb({
                isError: true,
                error: error
              });
            }
          });

          if (needSend) {
            var linkSenderArgs = this.linkSenderArgs;

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
          this._getCatchedReflect().toValueSync(function (ret) {
            var error = OpenArg(ret);
            cb({
              isError: true,
              error: error
            });
          });

          return;
        }

      end(iobCacher);
    };

    _proto.toAsyncValue = function toAsyncValue() {
      var iobCacher = this._iobCacher;

      if (iobCacher && (iobCacher.type === 2
      /* LOCAL */
      || iobCacher.type === 4
      /* REMOTE_SYMBOL */
      )) {
        return iobCacher.value;
      }

      return this.toHolder();
    };

    _proto._getCatchedReflect = function _getCatchedReflect() {
      var _catched = this._catchedReflect;

      if (!_catched) {
        var iobCacher = this._iobCacher;

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
    ;

    _proto.bindIOB = function bindIOB(iob, isError, port) {
      if (isError === void 0) {
        isError = false;
      }

      if (port === void 0) {
        port = this.core.port;
      }

      var iobCacher = this._iobCacher; /// 如果已经存在iobCacher，而且不是waiting的状态，那么重复绑定了。注意不能用`iobCacher?.type`

      if (iobCacher !== undefined && iobCacher.type !== 0
      /* WAITING */
      ) {
          throw new TypeError("already bind iob");
        }

      var _this$core = this.core,
          exportStore = _this$core.exportStore,
          importStore = _this$core.importStore;
      var remoteIob;
      var newIobCacher; /// 解析iob，将之定义成local或者remote两种模式

      switch (iob.type) {
        case 3
        /* Locale */
        :
          var loc = exportStore.getObjById(iob.locId) || exportStore.getSymById(iob.locId);

          if (!loc) {
            throw new ReferenceError();
          }

          newIobCacher = {
            type: 2
            /* LOCAL */
            ,
            value: loc,
            iob: iob
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
            iob: iob
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
            port: port,
            iob: iob
          };
          break;

        case 1
        /* RemoteSymbol */
        :
          remoteIob = iob;
          var sourceSym;
          var refExtends = iob["extends"];

          if (refExtends.global) {
            var globalSymInfo = globalSymbolStore.get(refExtends.description);

            if (!globalSymInfo) {
              throw new TypeError();
            }

            sourceSym = globalSymInfo.sym;
          } else {
            sourceSym = refExtends.unique ? Symbol["for"](refExtends.description) : Symbol(refExtends.description);
          }

          newIobCacher = {
            type: 4
            /* REMOTE_SYMBOL */
            ,
            port: port,
            value: sourceSym,
            iob: iob
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
        importStore.idExtendsStore.set(remoteIob.refId, remoteIob["extends"]); /// 缓存对象

        importStore.saveProxyId(isError ? this._getCatchedReflect().toAsyncValue() : this.toAsyncValue(), remoteIob.refId); /// 它是有指令长度的，那么清空指令；对应的，需要重新生成指令发送器

        this.linkSenderArgs = _extends({}, this.linkSenderArgs, {
          refId: remoteIob.refId,
          linkIn: []
        });
      } /// 核心属性变更，清理所有getter缓存


      cleanAllGetterCache(this);
      iobCacher === null || iobCacher === void 0 ? void 0 : iobCacher.waitter.forEach(function (cb) {
        // try {
        cb({
          isError: false,
          data: undefined
        }); // } catch (err) {
        //   console.error("uncatch error", err);
        // }
      });
    };

    _proto.getIOB = function getIOB() {
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
    };

    _proto.isBindedIOB = function isBindedIOB() {
      var _iobCacher = this._iobCacher;

      if (_iobCacher && _iobCacher.type !== 0
      /* WAITING */
      ) {
          return true;
        }

      return false;
    };

    _proto.waitIOB = function waitIOB() {
      throw new Error("Method not implemented.");
    };

    _proto.createSubHolder = function createSubHolder(subHolderLinkIn) {
      var linkSenderArgs = this.linkSenderArgs; /// 从空指令变成单指令

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
            linkSenderArgs.linkIn.length].concat(linkSenderArgs.linkIn, [/// 加入新的单指令
            subHolderLinkIn.length], subHolderLinkIn)
          }), this.core);
        } /// 维持多指令


      return new HolderReflect(_extends({}, linkSenderArgs, {
        linkIn: [].concat(linkSenderArgs.linkIn, [/// 加入新的单指令
        subHolderLinkIn.length], subHolderLinkIn)
      }), this.core);
    };

    _proto._getSubHolderPrimitiveSync = function _getSubHolderPrimitiveSync(linkIn, cb) {
      this.createSubHolder(linkIn).toValueSync(cb);
    } //#endregion
    //#region Reflect 接口
    //#region throw
    ;

    _proto.throw_binded = function throw_binded(cb) {
      var iobCacher = this._iobCacher;

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
    ;

    _proto.apply_local = function apply_local(cb, thisArgument, argumentsList) {
      resolveCallback(cb, Reflect.apply(this._iobCacher.value, thisArgument, argumentsList));
    };

    _proto.applyHolder = function applyHolder(thisArgument, argumentsList) {
      return this.createSubHolder([11
      /* Apply */
      , thisArgument].concat(argumentsList));
    };

    _proto.apply_remote = function apply_remote(cb, thisArgument, argumentsList) {
      this.applyHolder(thisArgument, argumentsList).toValueSync(cb);
    };

    //#endregion
    //#region Reflect.construct
    _proto.construct_local = function construct_local(cb, argumentsList, newTarget) {
      resolveCallback(cb, Reflect.construct(this._iobCacher.value, argumentsList, newTarget));
    };

    _proto.constructHolder = function constructHolder(argumentsList, newTarget) {
      return this.createSubHolder([12
      /* Construct */
      , newTarget].concat(argumentsList));
    };

    _proto.construct_remote = function construct_remote(cb, argumentsList, newTarget) {
      this.constructHolder(argumentsList, newTarget).toValueSync(cb);
    };

    //#endregion
    //#region Reflect.defineProperty
    _proto.defineProperty_local = function defineProperty_local(cb, propertyKey, attributes) {
      resolveCallback(cb, Reflect.defineProperty(this._iobCacher.value, propertyKey, attributes));
    };

    _proto.definePropertyHolder = function definePropertyHolder(propertyKey, attributes) {
      return this.createSubHolder([9
      /* DefineProperty */
      , propertyKey, attributes]);
    };

    _proto.defineProperty_remote = function defineProperty_remote(cb, propertyKey, attributes) {
      return this.definePropertyHolder(propertyKey, attributes).toValueSync(cb);
    };

    //#endregion
    //#region Reflect.deleteProperty
    _proto.deleteProperty_localObject = function deleteProperty_localObject(cb, propertyKey) {
      resolveCallback(cb, Reflect.deleteProperty(this._iobCacher.value, propertyKey));
    };

    _proto.deletePropertyHolder = function deletePropertyHolder(propertyKey) {
      return this.createSubHolder([8
      /* DeleteProperty */
      , propertyKey]);
    };

    _proto.deleteProperty_remote = function deleteProperty_remote(cb, propertyKey) {
      this.deletePropertyHolder(propertyKey).toValueSync(cb);
    };

    //#endregion
    //#region Reflect.get
    _proto.get_remoteFunction = function get_remoteFunction(cb, propertyKey) {
      var iobExtends = this._iobCacher.iob["extends"]; /// 自定义属性

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
    };

    _proto.get_local = function get_local(cb, propertyKey) {
      var iobCacher = this._iobCacher;
      resolveCallback(cb, Reflect.get(iobCacher.value, propertyKey));
    };

    _proto.getHolder = function getHolder(propertyKey) {
      return this.createSubHolder([6
      /* Get */
      , propertyKey]);
    };

    _proto.get_remote = function get_remote(cb, propertyKey) {
      this.getHolder(propertyKey).toValueSync(cb);
    };

    //#endregion
    //#region Reflect.getOwnPropertyDescriptor
    _proto.getOwnPropertyDescriptor_remoteFunction = function getOwnPropertyDescriptor_remoteFunction(cb, propertyKey) {
      var iobExtends = this._iobCacher.iob["extends"];

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
    };

    _proto.getOwnPropertyDescriptor_local = function getOwnPropertyDescriptor_local(cb, propertyKey) {
      var iobCacher = this._iobCacher;
      resolveCallback(cb, Reflect.getOwnPropertyDescriptor(iobCacher.value, propertyKey));
    };

    _proto.getOwnPropertyDescriptorHolder = function getOwnPropertyDescriptorHolder(propertyKey) {
      return this.createSubHolder([4
      /* GetOwnPropertyDescriptor */
      , propertyKey]);
    };

    _proto.getOwnPropertyDescriptor_remote = function getOwnPropertyDescriptor_remote(cb, propertyKey) {
      this.getOwnPropertyDescriptorHolder(propertyKey).toValueSync(cb);
    };

    _proto.getOwnPropertyDescriptor = function getOwnPropertyDescriptor(propertyKey) {
      return CallbackToAsync(this.getOwnPropertyDescriptorCallback, [propertyKey], this);
    } //#endregion
    //#region getPrototypeOf
    ;

    _proto.getPrototypeOf_local = function getPrototypeOf_local(cb) {
      var iobCacher = this._iobCacher;
      resolveCallback(cb, Reflect.getPrototypeOf(iobCacher.value));
    };

    _proto.getPrototypeOfHolder = function getPrototypeOfHolder() {
      return this.createSubHolder([0
      /* GetPrototypeOf */
      ]);
    };

    _proto.getPrototypeOf_remote = function getPrototypeOf_remote(cb) {
      this.getPrototypeOfHolder().toValueSync(cb);
    };

    //#endregion
    //#region Reflect.has
    _proto.has_remoteFunction = function has_remoteFunction(cb, propertyKey) {
      /**
       * 只要是函数（不论是否是箭头函数），就必然有这些属性
       */
      if ( /// T1 自身属性
      propertyKey === "name" || propertyKey === "length") {
        return resolveCallback(cb, true);
      }

      var iobExtends = this._iobCacher.iob["extends"];
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
    };

    _proto.has_local = function has_local(cb, propertyKey) {
      var iobCacher = this._iobCacher;
      resolveCallback(cb, Reflect.has(iobCacher.value, propertyKey));
    };

    _proto.hasHolder = function hasHolder(propertyKey) {
      return this.createSubHolder([5
      /* Has */
      , propertyKey]);
    };

    _proto.has_remote = function has_remote(cb, propertyKey) {
      return this.hasHolder(propertyKey).toValueSync(cb);
    };

    //#endregion
    //#region Reflect.isExtensible
    _proto.isExtensible_local = function isExtensible_local(cb) {
      var iobCacher = this._iobCacher;
      resolveCallback(cb, Reflect.isExtensible(iobCacher.value));
    };

    _proto.isExtensibleHolder = function isExtensibleHolder() {
      return this.createSubHolder([2
      /* IsExtensible */
      ]);
    };

    _proto.isExtensible_remote = function isExtensible_remote(cb) {
      this.isExtensibleHolder().toValueSync(cb);
    };

    //#endregion
    //#region Reflect.ownKeys
    _proto.ownKeys_local = function ownKeys_local(cb) {
      var iobCacher = this._iobCacher;
      resolveCallback(cb, Reflect.ownKeys(iobCacher.value));
    };

    _proto.ownKeysHolder = function ownKeysHolder() {
      return this.createSubHolder([10
      /* OwnKeys */
      ]);
    };

    _proto.ownKeys_remote = function ownKeys_remote(cb) {
      this.ownKeysHolder().toValueSync(cb);
    };

    //#endregion
    //#region Reflect.preventExtensions
    _proto.preventExtensions_local = function preventExtensions_local(cb) {
      var iobCacher = this._iobCacher;
      resolveCallback(cb, Reflect.preventExtensions(iobCacher.value));
    };

    _proto.preventExtensionsHolder = function preventExtensionsHolder() {
      return this.createSubHolder([3
      /* PreventExtensions */
      ]);
    };

    _proto.preventExtensions_remote = function preventExtensions_remote(cb) {
      this.preventExtensionsHolder().toValueSync(cb);
    };

    _proto.preventExtensions_onceRemote = function preventExtensions_onceRemote(cb) {
      var iobCacher = this._iobCacher;
      iobCacher.iob["extends"].status &= 3
      /* preventedExtensions */
      ;
      cleanGetterCache(this, "preventExtensionsCallback");
      cleanGetterCache(this, "preventExtensions");
      return this.preventExtensions_remote(cb);
    };

    //#endregion
    //#region Reflect.set
    _proto.set_local = function set_local(cb, propertyKey, value) {
      var iobCacher = this._iobCacher;
      resolveCallback(cb, Reflect.set(iobCacher.value, propertyKey, value));
    };

    _proto.setHolder = function setHolder(propertyKey, value) {
      return this.createSubHolder([7
      /* Set */
      , propertyKey, value]);
    };

    _proto.set_remote = function set_remote(cb, propertyKey, value) {
      return this.setHolder(propertyKey, value).toValueSync(cb);
    };

    //#endregion
    _proto.setPrototypeOf_local = function setPrototypeOf_local(cb, proto) {
      var iobCacher = this._iobCacher;
      resolveCallback(cb, Reflect.setPrototypeOf(iobCacher.value, proto));
    };

    _proto.setPrototypeOfHolder = function setPrototypeOfHolder(proto) {
      return this.createSubHolder([1
      /* SetPrototypeOf */
      , proto]);
    };

    _proto.setPrototypeOf_remote = function setPrototypeOf_remote(cb, proto) {
      return this.setPrototypeOfHolder(proto).toValueSync(cb);
    };

    //#endregion
    //#region Reflect 拓展接口

    /**
     * @WARN 不支持 with 操作符与对应的 Symbol.unscopables
     */
    _proto.asset_value = function asset_value(cb, propertyKey) {
      var iobCacher = this._iobCacher;
      resolveCallback(cb, iobCacher.value[propertyKey]);
    };

    _proto.assetHolder = function assetHolder(propertyKey) {
      return this.createSubHolder([13
      /* Asset */
      , propertyKey]);
    };

    _proto.asset_remote = function asset_remote(cb, propertyKey) {
      this.assetHolder(propertyKey).toValueSync(cb);
    };

    /**支持自定义的Symbol.toPrimitive以及Symbol.toStringTag，前者优先级更高 */
    _proto.toPrimitive = function toPrimitive(hint) {}
    /**instanceof 的操作符，支持自定义的Symbol.hasInstance */
    ;

    _proto.Operator_instanceOf = function Operator_instanceOf(Ctor) {};

    _proto.Operator_instanceOfHolder = function Operator_instanceOfHolder(Ctor) {
      return this.createSubHolder([15
      /* Instanceof */
      , Ctor]);
    }
    /**typeof 的操作符*/
    ;

    _proto.Operator_typeOf = function Operator_typeOf() {};

    _proto.Operator_typeOfHolder = function Operator_typeOfHolder() {
      return this.createSubHolder([14
      /* Typeof */
      ]);
    }
    /**delete 的操作符，支持primitive*/
    ;

    _proto.Operator_delete = function Operator_delete() {}
    /**... 的操作符*/
    ;

    _proto.Operator_spread = function Operator_spread() {}
    /**in 的操作符，支持自定义的Symbol.species*/
    ;

    _proto.Operator_in = function Operator_in() {}
    /**
     * @TIP 如果未来Emscripten支持《自定义运算符》，那么这里就需要扩展出更多的操作符了，因为这些操作都是只支持同步的。
     */

    /**支持自定义的Symbol.iterator，本地可用for await来进行迭代 */
    ;

    _proto.iterator = function iterator() {
      var _this = this;

      return _wrapAsyncGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        var iterable, item;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return _awaitAsyncGenerator(_this.assetHolder(Symbol.iterator).apply(_this.toAsyncValue(), []));

              case 2:
                iterable = _context.sent;

              case 3:
                _context.next = 5;
                return _awaitAsyncGenerator(iterable.next());

              case 5:
                item = _context.sent;
                _context.next = 8;
                return _awaitAsyncGenerator(item.done);

              case 8:
                if (!_context.sent) {
                  _context.next = 10;
                  break;
                }

                return _context.abrupt("break", 13);

              case 10:
                _context.next = 12;
                return item.value;

              case 12:
                {
                  _context.next = 3;
                  break;
                }

              case 13:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }))();
    }
    /**支持自定义的Symbol.asyncIterator，本地可用for await来进行迭代 */
    ;

    _proto.asyncIterator = function asyncIterator() {
      var _this2 = this;

      return _wrapAsyncGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
        var iterable, item;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return _awaitAsyncGenerator(_this2.assetHolder(Symbol.asyncIterator).apply(_this2.toAsyncValue(), []));

              case 2:
                iterable = _context2.sent;

              case 3:
                _context2.next = 5;
                return _awaitAsyncGenerator(iterable.next());

              case 5:
                item = _context2.sent;
                _context2.next = 8;
                return _awaitAsyncGenerator(item.done);

              case 8:
                if (!_context2.sent) {
                  _context2.next = 10;
                  break;
                }

                return _context2.abrupt("break", 13);

              case 10:
                _context2.next = 12;
                return item.value;

              case 12:
                {
                  _context2.next = 3;
                  break;
                }

              case 13:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }))();
    }
    /**支持自定义的Symbol.isConcatSpreadable */
    ;

    _proto.Array_concat = function Array_concat() {}
    /**支持自定义的Symbol.match */
    ;

    _proto.String_match = function String_match() {}
    /**支持自定义的Symbol.matchAll */
    ;

    _proto.String_matchAll = function String_matchAll() {}
    /**支持自定义的Symbol.replace */
    ;

    _proto.String_replace = function String_replace() {}
    /**支持自定义的Symbol.search */
    ;

    _proto.String_search = function String_search() {}
    /**支持自定义的Symbol.split */
    ;

    _proto.String_split = function String_split() {};

    _proto.Object_assign = function Object_assign() {};

    _proto.Object_create = function Object_create() {};

    _proto.Object_defineProperties = function Object_defineProperties() {};

    _proto.Object_defineProperty = function Object_defineProperty() {};

    _proto.Object_entries = function Object_entries() {};

    _proto.Object_freeze = function Object_freeze() {};

    _proto.Object_fromEntries = function Object_fromEntries() {};

    _proto.Object_getOwnPropertyDescriptor = function Object_getOwnPropertyDescriptor() {};

    _proto.Object_getOwnPropertyDescriptors = function Object_getOwnPropertyDescriptors() {};

    _proto.Object_getOwnPropertyNames = function Object_getOwnPropertyNames() {};

    _proto.Object_getOwnPropertySymbols = function Object_getOwnPropertySymbols() {};

    _proto.Object_getPrototypeOf = function Object_getPrototypeOf() {};

    _proto.Object_is = function Object_is() {};

    _proto.Object_isExtensible = function Object_isExtensible() {};

    _proto.Object_isFrozen = function Object_isFrozen() {};

    _proto.Object_isSealed = function Object_isSealed() {};

    _proto.Object_keys = function Object_keys() {};

    _proto.Object_preventExtensions = function Object_preventExtensions() {};

    _proto.Object_seal = function Object_seal() {};

    _proto.Object_setPrototypeOf = function Object_setPrototypeOf() {};

    _proto.Object_values = function Object_values() {};

    _proto.JSON_stringify = function JSON_stringify() {
      return this.createSubHolder([16
      /* JsonStringify */
      ]);
    };

    _proto.JSON_parse = function JSON_parse() {
      return this.createSubHolder([17
      /* JsonParse */
      ]);
    };

    _createClass(HolderReflect, [{
      key: "toValue",
      get: function get() {
        return CallbackToAsyncBind(this.toValueSync, this);
      }
    }, {
      key: "applyCallback",
      get: function get() {
        var iobCacher = this._iobCacher;

        if ( // 未知，未发送
        !iobCacher || // 未知，未返回
        iobCacher.type === 0
        /* WAITING */
        || /// 已知，远端是函数
        iobCacher.type === 3
        /* REMOTE_REF */
        && iobCacher.iob.type === 2
        /* Ref */
        && iobCacher.iob["extends"].type === 0
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
    }, {
      key: "apply",
      get: function get() {
        return CallbackToAsyncBind(this.applyCallback, this);
      }
    }, {
      key: "constructCallback",
      get: function get() {
        var iobCacher = this._iobCacher;

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
        && iobCacher.iob["extends"].type === 0
        /* Function */
        ) {
            if (iobCacher.iob["extends"].canConstruct) {
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
    }, {
      key: "construct",
      get: function get() {
        return CallbackToAsyncBind(this.constructCallback, this);
      }
    }, {
      key: "definePropertyCallback",
      get: function get() {
        var iobCacher = this._iobCacher;

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
    }, {
      key: "defineProperty",
      get: function get() {
        return CallbackToAsyncBind(this.definePropertyCallback, this);
      }
    }, {
      key: "deletePropertyCallback",
      get: function get() {
        var iobCacher = this._iobCacher;

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
    }, {
      key: "deleteProperty",
      get: function get() {
        return CallbackToAsyncBind(this.deletePropertyCallback, this);
      }
    }, {
      key: "getCallback",
      get: function get() {
        var iobCacher = this._iobCacher;

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
            && iobCacher.iob["extends"].type === 0
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
    }, {
      key: "get",
      get: function get() {
        return CallbackToAsyncBind(this.getCallback, this);
      }
    }, {
      key: "getOwnPropertyDescriptorCallback",
      get: function get() {
        var iobCacher = this._iobCacher;

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
            if (iobCacher.iob["extends"].type === 0
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
    }, {
      key: "getPrototypeOfCallback",
      get: function get() {
        var iobCacher = this._iobCacher;

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
    }, {
      key: "getPrototypeOf",
      get: function get() {
        return CallbackToAsyncBind(this.getPrototypeOfCallback, this);
      }
    }, {
      key: "hasCallback",
      get: function get() {
        var iobCacher = this._iobCacher;

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
            if (iobCacher.iob["extends"].type === 0
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
    }, {
      key: "has",
      get: function get() {
        return CallbackToAsyncBind(this.hasCallback, this);
      }
    }, {
      key: "isExtensibleCallback",
      get: function get() {
        var iobCacher = this._iobCacher;

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
            if (iobCacher.iob["extends"].status & 3
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
    }, {
      key: "isExtensible",
      get: function get() {
        return CallbackToAsyncBind(this.isExtensibleCallback, this);
      }
    }, {
      key: "ownKeysCallback",
      get: function get() {
        var iobCacher = this._iobCacher;

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
    }, {
      key: "ownKeys",
      get: function get() {
        return CallbackToAsyncBind(this.ownKeysCallback, this);
      }
    }, {
      key: "preventExtensionsCallback",
      get: function get() {
        var iobCacher = this._iobCacher;

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
              if ((iobCacher.iob["extends"].status & 3
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
    }, {
      key: "preventExtensions",
      get: function get() {
        return CallbackToAsyncBind(this.preventExtensionsCallback, this);
      }
    }, {
      key: "setCallback",
      get: function get() {
        var iobCacher = this._iobCacher;

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
            if (this.staticMode && (iobCacher.iob["extends"].status & 2
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
    }, {
      key: "set",
      get: function get() {
        return CallbackToAsyncBind(this.setCallback, this);
      }
    }, {
      key: "setPrototypeOfCallback",
      get: function get() {
        var iobCacher = this._iobCacher;

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
            if (this.staticMode && (iobCacher.iob["extends"].status & 3
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
    }, {
      key: "setPrototypeOf",
      get: function get() {
        return CallbackToAsyncBind(this.setPrototypeOfCallback, this);
      }
    }, {
      key: "assetCallback",
      get: function get() {
        var iobCacher = this._iobCacher;

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
            && iobCacher.iob["extends"].type === 0
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

    }, {
      key: "asset",
      get: function get() {
        return CallbackToAsyncBind(this.assetCallback, this);
      }
    }]);

    return HolderReflect;
  }();
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

  var AsyncModelTransfer = /*#__PURE__*/function (_ModelTransfer) {
    _inheritsLoose(AsyncModelTransfer, _ModelTransfer);

    function AsyncModelTransfer(core) {
      var _this;

      _this = _ModelTransfer.call(this, core) || this;
      /**
       * ref fun statis toString
       */

      _this._rfsts = refFunctionStaticToStringFactory();
      return _this;
    }
    /**这里保持使用cb风格，可以确保更好的性能
     * @TODO 内部的函数也应该尽可能使用cb风格来实现
     */


    var _proto = AsyncModelTransfer.prototype;

    _proto.sendLinkIn = function sendLinkIn(port, targetId, linkIn, hasOut) {
      var transfer = this.core.transfer;

      var doReq = function doReq(linkInIob) {
        port.req(function (ret) {
          try {
            var bin = OpenArg(ret);
            var linkObj = transfer.transferableBinary2LinkObj(bin);

            if (linkObj.type !== 3
            /* Out */
            ) {
                throw new TypeError();
              }

            if (linkObj.isThrow) {
              var err_iob = linkObj.out.slice().pop();

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
              var res_iob = linkObj.out.slice().pop();

              if (!res_iob) {
                throw new TypeError();
              }

              hasOut.bindIOB(res_iob);
            }

            return Promise.resolve();
          } catch (e) {
            return Promise.reject(e);
          }
        }, transfer.linkObj2TransferableBinary({
          type: 2
          /* In */
          ,
          // reqId,
          targetId: targetId,
          "in": linkInIob,
          hasOut: hasOut !== undefined
        }));
      }; /// 无参数需要解析，那么直接发送指令


      if (linkIn.length === 0) {
        doReq(linkIn);
      } else {
        (function () {
          /**结果列表 */
          var linkInIOB = [];
          /**结果列表的实际长度 */

          var linkInIOBLength = 0;
          /**是否已经完成中断 */

          var isRejected = false; /// 解析所有的参数

          var _loop = function _loop(index) {
            var item = linkIn[index];
            transfer.Any2InOutBinary(function (ret) {
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
          };

          for (var index = 0; index < linkIn.length; index++) {
            _loop(index);
          }
        })();
      }
    }
    /**
     * 主动生成引用代理
     * @param port
     * @param refId
     */
    ;

    _proto._createHolderByRefId = function _createHolderByRefId(port, refId, iob) {
      var holder = this._getHolder(port, refId, iob);

      return holder.toAsyncValue();
    };

    _proto._getHolder = function _getHolder(port, refId, iob) {
      var holder = new HolderReflect({
        port: port,
        refId: refId,
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
    ;

    _proto.Any2InOutBinary = function Any2InOutBinary(cb, obj) {
      var _this2 = this;

      var reflectHolder = getHolderReflect(obj);

      if (reflectHolder !== undefined) {
        var iob = reflectHolder.getIOB();

        if (!iob) {
          /// 还没有绑定，那么就等待其绑定完成
          return reflectHolder.toValueSync(function (valRet) {
            if (valRet.isError) {
              return cb(valRet);
            }

            _this2.Any2InOutBinary(cb, obj);
          }); // throw new TypeError(`reflectHolder ${reflectHolder.name} no bind iob`);
        }

        if (iob.type === 0
        /* Clone */
        ) {
            obj = iob.data;
          }
      }

      return _ModelTransfer.prototype.Any2InOutBinary.call(this, cb, obj);
    };

    _proto.InOutBinary2Any = function InOutBinary2Any(bin) {
      var _this$core = this.core,
          port = _this$core.port,
          importStore = _this$core.importStore,
          exportStore = _this$core.exportStore;

      switch (bin.type) {
        //   case LinkItemType.Default:
        //     return defaultCtx;
        case 3
        /* Locale */
        :
          var loc = exportStore.getObjById(bin.locId) || exportStore.getSymById(bin.locId);

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
          var cachedHolder = importStore.getProxyById(bin.refId);

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
    };

    return AsyncModelTransfer;
  }(ModelTransfer);

  var ComlinkAsync = /*#__PURE__*/function (_ComlinkCore) {
    _inheritsLoose(ComlinkAsync, _ComlinkCore);

    function ComlinkAsync(port, name) {
      var _this;

      _this = _ComlinkCore.call(this, port, name) || this;
      _this.transfer = new AsyncModelTransfer(_assertThisInitialized(_this));
      return _this;
    }

    var _proto = ComlinkAsync.prototype;

    _proto.wrap = function wrap(val) {
      throw new Error("Method not implemented.");
    } // readonly holderStore = new HolderStore(this.name);
    ;

    _proto.$getEsmReflectHanlder = function $getEsmReflectHanlder(opeartor) {
      var hanlder = _ComlinkCore.prototype.$getEsmReflectHanlder.call(this, opeartor);

      if (opeartor === 11
      /* Apply */
      || opeartor === 19
      /* SyncApply */
      ) {
          var applyHanlder = function applyHanlder(target, args) {
            if (target === Function.prototype.toString) {
              var ctx = args[0];
              var exportDescriptor = getFunctionExportDescription(ctx); /// 保护源码

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
    };

    _proto["import"] = function _import(key) {
      if (key === void 0) {
        key = "default";
      }

      try {
        var _this3 = this;

        return Promise.resolve(CallbackToAsync(_this3.$getImportModule, [], _this3)).then(function (importModule) {
          return Reflect.get(importModule, key);
        });
      } catch (e) {
        return Promise.reject(e);
      }
    };

    return ComlinkAsync;
  }(ComlinkCore);

  var __decorate$2 = undefined && undefined.__decorate || function (decorators, target, key, desc) {
    var c = arguments.length,
        r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
        d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) {
      if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    }
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };

  var __metadata$2 = undefined && undefined.__metadata || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
  };
  var AtomicsNotifyer = /*#__PURE__*/function () {
    function AtomicsNotifyer(_port) {
      var _this = this;

      this._port = _port;
      this._icbs = new Map();
      this._remoteMode = 3
      /* UNKNOWN */
      ;

      this._port.onMessage(function (data) {
        if (data instanceof Array) {
          for (var _iterator = _createForOfIteratorHelperLoose(data), _step; !(_step = _iterator()).done;) {
            var index = _step.value;

            var cbs = _this._icbs.get(index);

            if (cbs !== undefined) {
              _this._icbs["delete"](index);

              for (var _iterator2 = _createForOfIteratorHelperLoose(cbs), _step2; !(_step2 = _iterator2()).done;) {
                var cb = _step2.value;
                cb();
              }
            }
          }
        }
      });
    }

    var _proto = AtomicsNotifyer.prototype;

    _proto.waitAsync = function waitAsync(si32, index, value) {
      var _this2 = this;

      return new Promise(function (resolve) {
        _this2.waitCallback(si32, index, value, resolve);
      });
    };

    _proto.waitCallback = function waitCallback(si32, index, value, cb) {
      if (Atomics.load(si32, index) !== value) {
        return cb();
      }

      var cbs = this._icbs.get(index);

      if (cbs === undefined) {
        cbs = [cb];

        this._icbs.set(index, cbs);
      } else {
        cbs.push(cb);
      }
    };

    _proto._notify_unknow = function _notify_unknow(si32, indexs) {
      this._notify_async(si32, indexs);

      this._notify_sync(si32, indexs);
    };

    _proto._notify_async = function _notify_async(si32, indexs) {
      this._port.postMessage(indexs);
    };

    _proto._notify_sync = function _notify_sync(si32, indexs) {
      for (var _iterator3 = _createForOfIteratorHelperLoose(indexs), _step3; !(_step3 = _iterator3()).done;) {
        var index = _step3.value;
        Atomics.notify(si32, index);
      }
    };

    _createClass(AtomicsNotifyer, [{
      key: "remoteMode",
      set: function set(mode) {
        if (this._remoteMode !== mode) {
          this._remoteMode = mode;
          cleanGetterCache(this, "notify");
        }
      },
      get: function get() {
        return this._remoteMode;
      }
    }, {
      key: "notify",
      get: function get() {
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
    }]);

    return AtomicsNotifyer;
  }();

  __decorate$2([cacheGetter, __metadata$2("design:type", Object), __metadata$2("design:paramtypes", [])], AtomicsNotifyer.prototype, "notify", null);

  function u8Concat(ABC, u8s) {
    var totalLen = 0;

    for (var _iterator = _createForOfIteratorHelperLoose(u8s), _step; !(_step = _iterator()).done;) {
      var u8 = _step.value;
      totalLen += u8.length;
    }

    var u8a = new Uint8Array(new ABC(totalLen));
    var offsetLen = 0;

    for (var _iterator2 = _createForOfIteratorHelperLoose(u8s), _step2; !(_step2 = _iterator2()).done;) {
      var _u = _step2.value;
      u8a.set(_u, offsetLen);
      offsetLen += _u.length;
    }

    return u8a;
  }

  var DataPkg = function DataPkg(name, sab) {
    this.name = name;
    this.sab = sab;
    this.si32 = new Int32Array(this.sab);
    this.su8 = new Uint8Array(this.sab);
    this.su16 = new Uint16Array(this.sab);
  };

  var U32Reader = /*#__PURE__*/function () {
    function U32Reader() {
      this._u32 = new Uint32Array(1);
      this._u8 = new Uint8Array(this._u32.buffer);
    }

    var _proto = U32Reader.prototype;

    _proto.setByU8 = function setByU8(u8) {
      this._u8.set(u8);

      return this;
    };

    _proto.getU32 = function getU32() {
      return this._u32[0];
    };

    return U32Reader;
  }();

  var u32 = new U32Reader();

  var serialize = function serialize(data) {
    var json = JSON.stringify(data);
    var u8 = new Uint8Array(json.length);

    for (var i = 0; i < json.length; i++) {
      var code = json.charCodeAt(i);

      if (code > 256) {
        throw new RangeError("");
      }

      u8[i] = code;
    }

    return u8;
  };

  var deserialize = function deserialize(u8) {
    var json = "";

    for (var _iterator = _createForOfIteratorHelperLoose(u8), _step; !(_step = _iterator()).done;) {
      var code = _step.value;
      json += String.fromCharCode(code);
    }

    return JSON.parse(json);
  };
  var Duplex = /*#__PURE__*/function () {
    function Duplex(_port, sabs) {
      var _this = this;

      this._port = _port;
      this._notifyer = new AtomicsNotifyer(this._port);
      this._eventId = new Uint32Array(1);
      this._chunkCollection = new Map();
      this.supportModes = new Set();
      this._cbs = []; // Reflect.set(globalThis, "duplex", this);

      this.supportModes.add("async");
      this.supportModes.add("sync");
      var localeDataPkg = new DataPkg("locale", sabs.locale);
      var remoteDataPkg = new DataPkg("remote", sabs.remote);
      this._sync = {
        sabs: sabs,
        localeDataPkg: localeDataPkg,
        remoteDataPkg: remoteDataPkg
      };

      _port.onMessage(function (data) {
        if (data instanceof Array) {
          _this._checkRemote();
        }
      });
    }

    Duplex.getPort = function getPort(duplex) {
      return duplex._port;
    }
    /**发送异步消息 */
    ;

    var _proto = Duplex.prototype;

    _proto.postAsyncMessage = function postAsyncMessage(msg) {
      var _this2 = this;

      this._postMessageCallback(function (hook) {
        _this2._notifyer.waitCallback(hook.si32, 0
        /* SI32_MSG_TYPE */
        , hook.curMsgType, hook.next);
      }, function (hook) {
        _this2._notifyer.waitCallback(hook.si32, 0
        /* SI32_MSG_TYPE */
        , hook.msgType, hook.next);
      }, msg);
    };

    _proto.postSyncMessage = function postSyncMessage(msg) {
      var _this3 = this;

      this._postMessageCallback(function (hook) {
        _this3._checkRemoteAtomics(); // console.debug(threadId, "+openSAB");


        Atomics.wait(hook.si32, 0
        /* SI32_MSG_TYPE */
        , hook.curMsgType); // console.debug(threadId, "-openSAB");

        hook.next();
      }, function (hook) {
        _this3._checkRemoteAtomics(); // console.debug(threadId, "+waitSAB");
        // 进入等待


        Atomics.wait(hook.si32, 0
        /* SI32_MSG_TYPE */
        , hook.msgType); // console.debug(threadId, "-waitSAB");

        hook.next();
      }, msg);
    };

    _proto.waitMessage = function waitMessage() {
      do {
        // 等待对方开始响应
        Atomics.wait(this._sync.remoteDataPkg.si32, 0
        /* SI32_MSG_TYPE */
        , 0
        /* FREE */
        ); // 处理响应的内容

        var msg = this._checkRemoteAtomics();

        if (msg) {
          return msg;
        }
      } while (true);
    };

    _proto._postMessageCallback = function _postMessageCallback(onApplyWrite, onChunkReady, msg) {
      var _this4 = this;

      // console.debug("postMessage", threadId, msg);
      var msgBinary = this._serializeMsg(msg);

      var sync = this._sync;
      var _sync$localeDataPkg = sync.localeDataPkg,
          su8 = _sync$localeDataPkg.su8,
          si32 = _sync$localeDataPkg.si32,
          su16 = _sync$localeDataPkg.su16; // 数据id，用于将数据包和事件进行关联的ID

      var eventId = this._eventId[0]++; //#region 首先传输数据包

      {
        /// 自动分包模式
        var MSG_MAX_BYTELENGTH = su8.byteLength - 20
        /* U8_MSG_DATA_OFFSET */
        ;
        var chunkCount = Math.ceil(msgBinary.byteLength / MSG_MAX_BYTELENGTH);
        var chunkId = 0;
        var msgOffset = 0; // msgBinary.byteLength

        /**尝试写入 */

        var tryWriteChunk = function tryWriteChunk() {
          if (chunkId >= chunkCount) {
            return;
          } // 申请写入权


          checkAndApplyWrite();
        };
        /**申请写入权 */


        var checkAndApplyWrite = function checkAndApplyWrite() {
          // 直接申请
          var cur_msg_type = Atomics.compareExchange(si32, 0
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
            si32: si32,
            msgType: 1
            /* EVENT */
            ,
            curMsgType: cur_msg_type,
            next: checkAndApplyWrite
          });
        };
        /**获取写入权后，写入数据 */


        var doWriteChunk = function doWriteChunk() {
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

          var msgChunk = msgBinary.subarray(msgOffset, // 累加偏移量
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

          _this4._notifyer.notify(si32, [0
          /* SI32_MSG_TYPE */
          , 1
          /* SI32_MSG_STATUS */
          ]); // 钩子参数


          var hook = {
            msgType: 1
            /* EVENT */
            ,
            si32: si32,
            chunkId: chunkId,
            chunkCount: chunkCount,
            next: tryWriteChunk
          }; // 累加分包ID

          chunkId++; // 告知外部，写入完成了

          onChunkReady(hook);
        }; // 开始尝试写入


        tryWriteChunk();
      } //#endregion
    }
    /**主动检测远端是否发来消息 */
    ;

    _proto._checkRemoteAtomics = function _checkRemoteAtomics() {
      var remoteDataPkg = this._sync.remoteDataPkg; /// 如果本地还未收到消息，而且远端的堆栈信息不为空，那么就可以开始处理

      if (this._needOnMessageAtomics(remoteDataPkg)) {
        return this._onMessage(remoteDataPkg);
      }
    };

    _proto._checkRemote = function _checkRemote() {
      var remoteDataPkg = this._sync.remoteDataPkg; /// 如果本地还未收到消息，而且远端的堆栈信息不为空，那么就可以开始处理

      if (this._needOnMessage(remoteDataPkg)) {
        return this._onMessage(remoteDataPkg);
      }
    }
    /**是否需要处理消息 */
    ;

    _proto._needOnMessageAtomics = function _needOnMessageAtomics(dataPkg) {
      if (dataPkg.si32[0
      /* SI32_MSG_TYPE */
      ] !== 0
      /* FREE */
      ) {
          do {
            var cur_msg_status = dataPkg.si32[1
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
    ;

    _proto._needOnMessage = function _needOnMessage(dataPkg) {
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
    ;

    _proto._onMessage = function _onMessage(dataPkg) {
      var si32 = dataPkg.si32,
          su8 = dataPkg.su8,
          su16 = dataPkg.su16;

      switch (si32[0
      /* SI32_MSG_TYPE */
      ]) {
        case 1
        /* EVENT */
        :
          {
            /**事件ID */
            var eventId = si32[2
            /* U32_EVENT_ID_INDEX */
            ];
            /**分包的数量 */

            var chunkCount = su16[5
            /* U16_CHUNK_COUNT_INDEX */
            ];
            /**数据包编号*/

            var chunkId = su16[6
            /* U16_CHUNK_ID_INDEX */
            ];
            /**数据包大小 */

            var chunkSize = si32[4
            /* U32_MSG_CHUNK_SIZE_INDEX */
            ];
            /**数据包 */

            var chunk = su8.subarray(20
            /* U8_MSG_DATA_OFFSET */
            , 20
            /* U8_MSG_DATA_OFFSET */
            + chunkSize);
            var cachedChunkInfo;
            var msgBinary; /// 单包

            if (1 === chunkCount) {
              msgBinary = new Uint8Array(chunk);
            } else {
              /// 分包
              cachedChunkInfo = this._chunkCollection.get(eventId);

              if (cachedChunkInfo) {
                cachedChunkInfo.set(chunkId, chunk); /// 如果数据包已经完整了，那么整理出完整的数据包

                if (cachedChunkInfo.size === chunkCount) {
                  // 删除缓存
                  this._chunkCollection["delete"](eventId); /// 合并分包


                  var chunkList = [];
                  /**
                   * 这里支持无序传输，如果底层使用WebRTC，可以更节省设备资源
                   */

                  for (var _iterator2 = _createForOfIteratorHelperLoose(cachedChunkInfo), _step2; !(_step2 = _iterator2()).done;) {
                    var chunkItem = _step2.value;
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
    };

    _proto._msgBinaryHandler = function _msgBinaryHandler(msgBinary) {
      // console.debug("onMessage", threadId, msgBinary);
      var msg;

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
            throw new TypeError("unknown msgType:'" + msgBinary[0] + "'");
        }
      } catch (err) {
        debugger;
        throw err;
      }

      for (var _iterator3 = _createForOfIteratorHelperLoose(this._cbs), _step3; !(_step3 = _iterator3()).done;) {
        var cb = _step3.value;
        cb(msg);
      }

      return msg;
    };

    _proto.onMessage = function onMessage(cb) {
      this._cbs.push(cb);
    } /// 消息序列化
    // private _msg_ABC: typeof SharedArrayBuffer | typeof ArrayBuffer = ArrayBuffer;
    ;

    _proto._serializeMsg = function _serializeMsg(msg) {
      var msgBinary;

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
    };

    return Duplex;
  }();

  var MagicBinaryPort = /*#__PURE__*/function () {
    function MagicBinaryPort(_duplex) {
      var _this = this;

      this._duplex = _duplex;
      this._reqId = new Uint32Array(1);
      this._resMap = new Map();

      _duplex.onMessage(function (msg) {
        if (msg.msgType === "RES") {
          var resId = msg.msgId;

          var output = _this._resMap.get(resId);

          if (!output) {
            throw new TypeError("no found responser"); // return;
          }

          _this._resMap["delete"](resId);

          var ret = msg.msgContent;
          SyncForCallback(output, function () {
            var resBin = OpenArg(ret);

            if (!resBin) {
              throw new TypeError();
            }

            return resBin;
          });
        } else {
          var reqId = msg.msgId;

          _this._reqHandler(function (ret) {
            if (reqId === undefined) {
              return;
            }

            _this._postModeMessage({
              msgType: "RES",
              msgId: reqId,
              msgContent: ret
            });
          }, msg.msgContent);
        }
      });
    }

    var _proto = MagicBinaryPort.prototype;

    _proto.onMessage = function onMessage(listener) {
      this._reqHandler = listener;
    };

    _proto.send = function send(bin) {
      this._duplex.postAsyncMessage({
        msgType: "SIM",
        msgId: undefined,
        msgContent: bin
      });
    };

    return MagicBinaryPort;
  }();
  var SyncBinaryPort = /*#__PURE__*/function (_MagicBinaryPort) {
    _inheritsLoose(SyncBinaryPort, _MagicBinaryPort);

    function SyncBinaryPort() {
      return _MagicBinaryPort.apply(this, arguments) || this;
    }

    var _proto2 = SyncBinaryPort.prototype;

    _proto2._postModeMessage = function _postModeMessage(msg) {
      this._duplex.postSyncMessage(msg);
    };

    _proto2.req = function req(output, bin) {
      var reqId = this._reqId[0]++;
      var hasOutput = false;

      var reqOutput = function reqOutput(ret) {
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
    };

    return SyncBinaryPort;
  }(MagicBinaryPort);
  var AsyncBinaryPort = /*#__PURE__*/function (_MagicBinaryPort2) {
    _inheritsLoose(AsyncBinaryPort, _MagicBinaryPort2);

    function AsyncBinaryPort() {
      return _MagicBinaryPort2.apply(this, arguments) || this;
    }

    var _proto3 = AsyncBinaryPort.prototype;

    _proto3._postModeMessage = function _postModeMessage(msg) {
      this._duplex.postAsyncMessage(msg);
    };

    _proto3.req = function req(output, bin) {
      var reqId = this._reqId[0]++;

      this._resMap.set(reqId, output);

      this._postModeMessage({
        msgType: "REQ",
        msgId: reqId,
        msgContent: bin
      });
    };

    return AsyncBinaryPort;
  }(MagicBinaryPort);

  var MagicBinaryChannel = function MagicBinaryChannel(_duplex, localSab, remoteSab) {
    if (localSab === void 0) {
      localSab = new SharedArrayBuffer(1024);
    }

    if (remoteSab === void 0) {
      remoteSab = new SharedArrayBuffer(1024);
    }

    this._duplex = _duplex;
    this.localSab = localSab;
    this.remoteSab = remoteSab;
  };

  var SyncBinaryChannel = /*#__PURE__*/function (_MagicBinaryChannel) {
    _inheritsLoose(SyncBinaryChannel, _MagicBinaryChannel);

    function SyncBinaryChannel() {
      var _this;

      _this = _MagicBinaryChannel.apply(this, arguments) || this;
      _this.port = new SyncBinaryPort(_this._duplex);
      return _this;
    }

    return SyncBinaryChannel;
  }(MagicBinaryChannel);
  var AsyncBinaryChannel = /*#__PURE__*/function (_MagicBinaryChannel2) {
    _inheritsLoose(AsyncBinaryChannel, _MagicBinaryChannel2);

    function AsyncBinaryChannel() {
      var _this2;

      _this2 = _MagicBinaryChannel2.apply(this, arguments) || this;
      _this2.port = new AsyncBinaryPort(_this2._duplex);
      return _this2;
    }

    return AsyncBinaryChannel;
  }(MagicBinaryChannel);

  var Comlink = /*#__PURE__*/function () {
    function Comlink(options) {}

    var _proto = Comlink.prototype;

    _proto.asyncModule = function asyncModule(moduleName, duplex) {
      if (!duplex.supportModes.has("async")) {
        throw new TypeError("duplex no support async mode");
      }

      var binaryChannel = new AsyncBinaryChannel(duplex);
      return new ComlinkAsync(binaryChannel.port, moduleName);
    };

    _proto.syncModule = function syncModule(moduleName, duplex) {
      if (!duplex.supportModes.has("sync")) {
        throw new TypeError("duplex no support sync mode");
      }

      var binaryChannel = new SyncBinaryChannel(duplex);
      return new ComlinkSync(binaryChannel.port, moduleName);
    };

    return Comlink;
  }();

  var Endpoint = /*#__PURE__*/function () {
    function Endpoint(_port) {
      this._port = _port;
      this.postMessage = this._port.postMessage.bind(this._port);
    }

    var _proto = Endpoint.prototype;

    _proto.onMessage = function onMessage(listener) {
      this._port.start();

      this._port.addEventListener("message", function (e) {
        return listener(e.data);
      });
    };

    return Endpoint;
  }(); // export const EndpointFactory: BFChainComlink.Duplex.EndpointFactory = (port: MessagePort) => {
  //   return new Endpoint(port);
  // };

  var PORT_SABS_WM = new WeakMap();
  var DuplexFactory = /*#__PURE__*/function () {
    function DuplexFactory(_mc) {
      if (_mc === void 0) {
        _mc = new MessageChannel();
      }

      this._mc = _mc;
    }
    /**作为子线程运作 */


    DuplexFactory.asCluster = function asCluster(workerSelf) {
      try {
        var sabs;
        return Promise.resolve(new Promise(function (resolve, reject) {
          var onMessage = function onMessage(me) {
            var data = me.data;

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
        })).then(function (port2) {
          if (!sabs) {
            throw new TypeError();
          }

          PORT_SABS_WM.set(port2, sabs);
          var duplex = new Duplex(new Endpoint(port2), sabs);
          return duplex;
        });
      } catch (e) {
        return Promise.reject(e);
      }
    };

    var _proto = DuplexFactory.prototype;

    _proto._getSabs = function _getSabs(port) {
      var sabs = PORT_SABS_WM.get(port);

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
    ;

    _proto.getDuplex = function getDuplex() {
      var duplex = this._duplex;

      if (!duplex) {
        var sabs = this._getSabs(this._mc.port1);

        duplex = new Duplex(new Endpoint(this._mc.port1), sabs);
        this._duplex = duplex;
      }

      return duplex;
    }
    /**作为主线程运作 */
    ;

    _proto.asMain = function asMain(workerIns) {
      var sabs = this._getSabs(this._mc.port1);

      try {
        workerIns.postMessage([sabs.remote, sabs.locale]);
      } catch (err) {
        console.error(err);
        throw new SyntaxError("no support use transfer SharedArrayBuffer in channel");
      }

      workerIns.postMessage(this._mc.port2, [this._mc.port2]);
    };

    return DuplexFactory;
  }();

  var TaskLog = /*#__PURE__*/function () {
    function TaskLog(groupName) {
      this.groupName = groupName;
      this._fails = [];
      this.log = console.log;
      this.warn = console.warn;
      this.error = console.error;
      this.info = console.info;
      this.debug = console.debug;
    }

    var _proto = TaskLog.prototype;

    _proto.assert = function assert(isTrue, msg) {
      if (!isTrue) {
        this._fails.push(msg);
      }

      console.assert(isTrue, msg);
    };

    _proto.finish = function finish() {
      if (this._fails.length === 0) {
        console.log("\u2705 ~ all [" + this.groupName + "] test passed!");
      } else {
        console.error("\u26D4 [" + this.groupName + "] has " + this._fails.length + " test failed.");
      }
    };

    return TaskLog;
  }();

  function _catch$2(body, recover) {
    try {
      var result = body();
    } catch (e) {
      return recover(e);
    }

    if (result && result.then) {
      return result.then(void 0, recover);
    }

    return result;
  }

  var installWebEnv = function installWebEnv(scriptUrl, mainThreadCallback, workerThreadCallback, workerThreadCallback2) {
    try {
      var _a, _b;

      var _temp7 = function () {
        if (scriptUrl) {
          console.log("main started"); /// 模拟A模块作为服务模块

          var _temp8 = _catch$2(function () {
            {
              var duplexFactory = new DuplexFactory();
              /**模块控制器 */

              var moduleA = comlink.asyncModule("A", duplexFactory.getDuplex()); // 执行回调

              return Promise.resolve(mainThreadCallback(moduleA)).then(function () {
                {
                  /// 启动子线程，并将messagechannel发送给子线程
                  var worker = new Worker(scriptUrl, {
                    name: "async"
                  });

                  worker.onmessage = function (e) {
                    return e.data === "exit" && worker.terminate();
                  }; // 执行发送


                  duplexFactory.asMain(worker);
                }
                {
                  var duplexFactory2 = new DuplexFactory();
                  var moduleA2 = comlink.asyncModule("A", duplexFactory2.getDuplex()); // 执行回调

                  return Promise.resolve(mainThreadCallback(moduleA2)).then(function () {
                    {
                      /// 启动子线程，并将messagechannel发送给子线程
                      var _worker = new Worker(scriptUrl, {
                        name: "sync"
                      });

                      _worker.onmessage = function (e) {
                        return e.data === "exit" && _worker.terminate();
                      }; // 执行发送


                      duplexFactory2.asMain(_worker);
                    }
                  });
                }
              });
            }
          }, function (err) {
            console.error("❌ Main Error", (_a = err === null || err === void 0 ? void 0 : err.stack) !== null && _a !== void 0 ? _a : err);
          });

          if (_temp8 && _temp8.then) return _temp8.then(function () {});
        } else {
          var _temp9 = function _temp9() {
            // 退出子线程
            setTimeout(function () {
              self.postMessage("exit");
            }, 10);
          };

          var mode = self.name;

          var _console = new TaskLog("mix-" + mode);

          _console.log("worker " + mode + " started");

          var _temp10 = _catch$2(function () {
            /// 等待通道连接到位
            return Promise.resolve(DuplexFactory.asCluster(self)).then(function (duplex) {
              function _temp3() {
                _console.finish();
              }

              var _temp2 = function () {
                if (mode === "async") {
                  /// 模拟B模块作为调用模块

                  /**模块控制器 */
                  var moduleB = comlink.asyncModule("B", duplex); // 回调

                  return Promise.resolve(workerThreadCallback(moduleB, _console)).then(function () {});
                } else {
                  /**模块控制器 */
                  var moduleB2 = comlink.syncModule("B2", duplex); // 回调

                  return Promise.resolve(workerThreadCallback2(moduleB2, _console)).then(function () {});
                }
              }();

              return _temp2 && _temp2.then ? _temp2.then(_temp3) : _temp3(_temp2);
            });
          }, function (err) {
            _console.error("❌ Worker Error", (_b = err === null || err === void 0 ? void 0 : err.stack) !== null && _b !== void 0 ? _b : err);
          });

          return _temp10 && _temp10.then ? _temp10.then(_temp9) : _temp9(_temp10);
        }
      }();

      return Promise.resolve(_temp7 && _temp7.then ? _temp7.then(function () {}) : void 0);
    } catch (e) {
      return Promise.reject(e);
    }
  };
  var comlink = new Comlink();

  function testRunner(scriptUrl) {
    var A = "~aAa~";
    installWebEnv(scriptUrl, function (moduleA) {
      /**随便一个常量 */
      var a = A;
      moduleA["export"](a, "a");
      moduleA["export"](document, "document");
    }, function (moduleB, console) {
      try {
        return Promise.resolve(moduleB["import"]("a")).then(function (a) {
          Reflect.set(globalThis, "a", a);
          console.assert(a === A, "import");
          return Promise.resolve(moduleB["import"]("document")).then(function (document) {
            Reflect.set(globalThis, "document", document);
            return Promise.resolve(document.createElement("div")).then(function (div) {
              var id = "id-" + self.name + "-" + Math.random().toString(36).slice(2);
              var textContent = "T~" + self.name + "~#" + id + "~T";
              div.id = id;
              div.textContent = textContent;
              document.body.appendChild(div);
              var _log = console.log;
              return Promise.resolve(div.textContent).then(function (_div$textContent) {
                _log.call(console, _div$textContent);

                var _assert = console.assert;
                return Promise.resolve(div.textContent).then(function (_div$textContent2) {
                  _assert.call(console, _div$textContent2 === textContent, "textContent");

                  return Promise.resolve(document.querySelector("#" + id)).then(function (div2) {
                    console.assert(JSON.stringify(HolderReflect.getHolderReflect(div).getIOB()) === JSON.stringify(HolderReflect.getHolderReflect(div2).getIOB()), "ref");
                  });
                });
              });
            });
          });
        });
      } catch (e) {
        return Promise.reject(e);
      }
    }, function (moduleB, console) {
      /// test import
      var a = moduleB["import"]("a");
      Reflect.set(self, "a", a);
      console.assert(a === A, "import");
      var document = moduleB["import"]("document");
      Reflect.set(self, "document", document);
      var div = document.createElement("div");
      var id = "id-" + self.name + "-" + Math.random().toString(36).slice(2);
      var textContent = "T~" + self.name + "~#" + id + "~T";
      div.id = id;
      div.textContent = textContent;
      document.body.appendChild(div);
      console.assert(div.textContent === textContent, "textContent");
      var div2 = document.querySelector("#" + id);
      console.assert(div2 === div, "ref");
    });
  }

  Reflect.set(self, "testRunner", testRunner);

  if (typeof document !== "object") {
    testRunner();
  } else {
    testRunner(document.querySelector("script").src);
  }

})));
//# sourceMappingURL=comlink-test-web.umd.js.map
