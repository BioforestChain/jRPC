import { InnerComlink, SimpleBinaryChannel } from "./index";
import { performance } from "perf_hooks";

class ConfigService {
  private config: { [key: string]: unknown } = {};
  reset() {
    this.config = {};
  }
  /**不可拓展，但是可以删除可以修改 */
  preventExtensions() {
    Object.preventExtensions(this.config);
  }
  /**不可添加不可删除，但是可以修改 */
  seal() {
    Object.seal(this.config);
  }
  /**不可添加不可删除不可修改 */
  freeze() {
    Object.freeze(this.config);
  }
  set(key: string, value: unknown) {
    return Reflect.set(this.config, key, value);
  }
  get<T>(key: string) {
    return Reflect.get(this.config, key) as T | undefined;
  }
  del(key: string) {
    return Reflect.deleteProperty(this.config, key);
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
  const ctxA = new ConfigService();
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
  const ctxA = moduleB.import<ConfigService>();

  const s = performance.now();

  const TIMES = 10000;
  console.log("start run test %d times", TIMES);
  for (let i = 0; i < TIMES; i++) {
    // freedom mode
    ctxA.reset();
    console.assert(ctxA.set("a", 1) === true, "freedom, could insert");
    console.assert(ctxA.get("a") === 1, "freedom, check get");
    console.assert(ctxA.del("a") === true, "freedom, could del");

    // preventExtensions mode
    ctxA.reset();
    ctxA.set("a", 1);
    ctxA.set("b", 1);
    ctxA.preventExtensions();
    console.assert(ctxA.set("a", 2) === true, "preventExtensions, could update");
    console.assert(ctxA.get("a") === 2, "preventExtensions, check get");
    console.assert(ctxA.del("b") === true, "preventExtensions, could del");
    console.assert(ctxA.set("b", 2) === false, "preventExtensions, could not insert");

    // seal mode
    ctxA.reset();
    ctxA.set("a", 1);
    ctxA.seal();
    console.assert(ctxA.set("a", 3) === true, "seal, could update");
    console.assert(ctxA.get("a") === 3, "seal, check get");
    console.assert(ctxA.set("b", 3) === false, "seal, could note insert");
    console.assert(ctxA.del("a") === false, "seal, could note delete");

    // freeze mode
    ctxA.reset();
    ctxA.set("a", 1);
    ctxA.seal();
    ctxA.freeze();
    console.assert(ctxA.set("a", 4) === false, "freeze, could note update");
    console.assert(ctxA.get("a") === 1, "freeze, check get");
    console.assert(ctxA.set("b", 4) === false, "freeze, could note insert");
    console.assert(ctxA.del("a") === false, "freeze, could note delete");
    if (i === 3000||i === 6000) {
      await new Promise((cb) => setTimeout(cb, 10));
    }
  }
  console.log("🎊 ~ all test passed! use %d ms", performance.now() - s);
})().catch((err) => {
  console.error("TEST FAIL:", err.stack);
});
