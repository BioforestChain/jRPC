import { InnerComlink, SimpleBinaryChannel } from "./index";

class TestService {
  private name = "Gaubee";
  say(word: string) {
    return `${this.name}: xxxx-${word}-xxxx`;
  }
  zz(cb: (arg: { k: string; v: string }) => number) {
    console.log(cb({ k: "xxx", v: "zzz" }));
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
}

/**
 * 生成一对相通的管道
 */
const { portA, portB } = new SimpleBinaryChannel<InnerComlink.TB>();

/// 模拟A模块作为服务模块
(async () => {
  /**模块控制器 */
  const moduleA = new InnerComlink(portA, "A");
  (global as any).moduleA = moduleA;

  /**生成服务 */
  const ctxA = new TestService();
  /**随便一个常量 */
  const a = 1;
  /**
   * 导出服务
   * 同语法： export default ctxA
   * 同语法： export const a = 1
   */
  moduleA.export(ctxA);
  moduleA.export(a, "a");
})();

/// 模拟B模块作为调用模块
(async function () {
  /**模块控制器 */
  const moduleB = new InnerComlink(portB, "B");
  (global as any).moduleB = moduleB;

  /**
   * 导入服务
   * 同语法：
   * import ctx from port
   * import {a} from port
   */
  const ctxA = moduleB.import<TestService>(portB);
  const a = moduleB.import<number>(portB, "a");

  // 执行
  console.log("a:", a);
  console.log(ctxA.say("qaq"));
  console.log(ctxA.constructor.toString().split("\n", 1)[0]);
  console.log(typeof ctxA.constructor);
  ctxA.zz((arg) => {
    return arg.k.length + arg.v.length;
  });
  console.log(ctxA instanceof Function);
  console.log(ctxA instanceof ctxA.constructor);

  /// test symbol
  const arr = [1];
  console.log(ctxA.concat(arr, [2]));
  Object.defineProperty(arr, Symbol.isConcatSpreadable, { value: false });
  console.log(ctxA.concat(arr, [2]));

  const obj = {
    [Symbol.toPrimitive](hint: string) {
      console.log("GET toPrimitive!!!", hint);
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
  console.log(Number(obj));
  console.log(String(obj2));
  console.log(ctxA.toPrimitive(obj, "number"));
  console.log(ctxA.toPrimitive(obj, "string"));
  try {
    ctxA.throwLocalError("qaq1");
  } catch (err) {
    console.log(String(err).startsWith("Error: qaq1"));
  }
  let err = new SyntaxError("qaq2");
  try {
    debugger;
    ctxA.throwRemoteError(err);
  } catch (err) {
    console.log(String(err).startsWith("SyntaxError: qaq2"));
  }
})().catch((err) => {
  console.error("TEST FAIL:", err.stack);
});
