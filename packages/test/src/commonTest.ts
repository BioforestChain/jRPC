// 通用测试

import { format } from "util";

/**基础测试类 */
export class TestService {
  private name = "Gaubee";
  say(word: string) {
    return `${this.name}: xxxx-${word}-xxxx`;
  }
  useCallback<T, R>(arg: T, cb: (arg: T) => R) {
    return cb(arg);
  }
  concat(arr1: unknown[], arr2: unknown[]) {
    return arr1.concat(arr2);
  }
  toPrimitive(obj: unknown, type: "number" | "string") {
    if (type === "number") {
      return Number(obj);
    }
    return String(obj);
  }
  private _e?: Error;
  throwLocalError(message: string) {
    throw (this._e = new Error(message));
  }
  throwRemoteError(err: Error) {
    throw err;
  }
  think(ms: number) {
    return new Promise((cb) => setTimeout(cb, ms));
  }

  static testApply(ctxA: TestService) {
    console.assert(ctxA.say("qaq") === "Gaubee: xxxx-qaq-xxxx", "call say");
    console.assert(
      ctxA.constructor.toString() === `class TestService { [remote code] }`,
      "toString",
    );
    console.assert(
      ctxA.useCallback({ k: "qaq", v: "quq" }, (arg) => {
        return arg.k.length + arg.v.length;
      }) === 6,
      "use callback",
    );
  }
  static testFunctionType(ctxA: TestService) {
    console.assert(ctxA.constructor.toString === ctxA.say.toString, "Function.prototype.toString");
    console.assert(
      ctxA.constructor.toString.toString() === "function () { [native code] }",
      "Function.prototype.toString is in local",
    );
    console.assert(typeof ctxA.constructor === "function", "ctor is function");
    console.assert(
      ctxA.constructor instanceof Function === false,
      "ctor no current isolate's function",
    );
    console.assert(ctxA instanceof ctxA.constructor, "instanceof");
  }
  static testSymbol(ctxA: TestService) {
    const arr = [1];
    console.assert(format(ctxA.concat(arr, [2])) === "[ 1, 2 ]", "isConcatSpreadable === true");
    Object.defineProperty(arr, Symbol.isConcatSpreadable, { value: false });
    console.assert(
      format(ctxA.concat(arr, [2])) === "[ [ 1 ], 2 ]",
      "isConcatSpreadable === false",
    );

    let latestHit = "";
    const obj = {
      [Symbol.toPrimitive](hint: string) {
        latestHit = hint;
        if (hint === "number") {
          return 123;
        }
        if (hint === "string") {
          return "qaq";
        }
        return null;
      },
    };
    const obj2 = Object.create(obj);
    console.assert(ctxA.toPrimitive(obj, "number") === 123, "to number");
    console.assert(latestHit === "number");
    console.assert(ctxA.toPrimitive(obj2, "string") === "qaq", "to string");
    console.assert(latestHit === "string");
  }
  static testThrow(ctxA: TestService) {
    try {
      ctxA.throwLocalError("qaq1");
    } catch (err) {
      console.assert(String(err).startsWith("Error: qaq1"), "throw 1");
    }
    let err = new SyntaxError("qaq2");
    try {
      ctxA.throwRemoteError(err);
    } catch (err) {
      console.assert(String(err).startsWith("SyntaxError: qaq2"), "throw 2");
    }
  }
  static testPromise(ctxA: TestService) {
    return Promise.all([ctxA.think(10), ctxA.think(10)]);
  }

  static async testAll(ctxA: TestService) {
    this.testApply(ctxA);
    this.testFunctionType(ctxA);
    this.testSymbol(ctxA);
    this.testThrow(ctxA);
    await this.testPromise(ctxA);
  }
}
