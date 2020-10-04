import { InnerComlink, SimpleBinaryChannel } from "./index";
import { TestService } from "./commonTest";

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
   * import {a} from port
   * import ctx from port
   */

  /// test import
  const a = moduleB.import<number>("a");
  console.assert(a === 1, "import");

  const ctxA = moduleB.import<TestService>();
  TestService.testAll(ctxA);

  console.log("🎊 ~ all test passed!");
})().catch((err) => {
  console.error("TEST FAIL:", err.stack);
});
