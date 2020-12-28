import { installMixEnv } from "./envWrapper/mixEnv";
import { TestService } from "./testTemplate/commonTest";

const A = "~aAa~";
installMixEnv(
  (moduleA) => {
    /**生成服务 */
    const ctxA = new TestService();
    /**随便一个常量 */
    const a = A;
    /**
     * 导出服务
     * 同语法： export default ctxA
     * 同语法： export const a = 1
     */
    moduleA.export(ctxA);
    moduleA.export(a, "a");
  },
  async (moduleB) => {
    /**
     * 导入服务
     * 同语法：
     * import {a} from port
     * import ctx from port
     */

    /// test import
    const a = await moduleB.import<typeof A>("a");
    Reflect.set(globalThis, "a", a);
    console.assert(a === A, "import");

    const ctxA = await moduleB.import<TestService>();
    Reflect.set(globalThis, "ctxA", ctxA);
    await TestService.testAll2(ctxA);
  },
  async (moduleB) => {
    /**
     * 导入服务
     * 同语法：
     * import {a} from port
     * import ctx from port
     */

    /// test import
    const a = moduleB.import<typeof A>("a");
    Reflect.set(globalThis, "a", a);
    console.assert(a === A, "import");

    const ctxA = moduleB.import<TestService>();
    Reflect.set(globalThis, "ctxA", ctxA);
    await TestService.testAll(ctxA);

    console.log("start test thinkSync");
    const thinkSync = moduleB.asyncToSync(ctxA.think);
    {
      const startTime = Date.now();
      thinkSync(1000);
      const endTime = Date.now();
      console.assert(endTime - startTime, "tinkSync");
      console.log(`✅ test thinkSync passed (${endTime - startTime}ms)`);
    }
    console.log("start test fibAsync");
    const fibAsync = moduleB.syncToAsync(ctxA.work);
    {
      let i = 0;
      const ti = setInterval(() => (i += 1), 10);
      await fibAsync(42);
      clearInterval(ti);
      console.assert(i > 0, "fibAsync");
      console.log(`✅ test fibAsync passed (${i * 10}ms+)`);
    }
  },
);
