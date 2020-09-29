import { InnerComlink, SimpleBinaryChannel } from "./index";

class TestService {
  private name = "Gaubee";
  say(word: string) {
    return `${this.name}: xxxx-${word}-xxxx`;
  }
  zz(cb: (arg: { k: string; v: string }) => number) {
    console.log(cb({ k: "xxx", v: "zzz" }));
  }
}

/**
 * 生成一对相通的管道
 */
const { portA, portB } = new SimpleBinaryChannel<InnerComlink.TB>();

/// 模拟A模块作为服务模块
(async () => {
  /**模块控制器 */
  const moduleA = new InnerComlink("A");
  moduleA.listen(portA);

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
  const moduleB = new InnerComlink("B");
  moduleB.listen(portB);

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
  console.log(ctxA.constructor.toString());
  console.log(typeof ctxA.constructor);
  ctxA.zz((arg) => {
    return arg.k.length + arg.v.length;
  });
  console.log(ctxA instanceof Function);
  debugger;
  console.log(ctxA instanceof ctxA.constructor);
})().catch((err) => {
  console.error("???", err.message);
});
