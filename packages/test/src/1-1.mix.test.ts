import { installMixEnv } from "./envWrapper/mixEnv";
import { TaskLog } from "./envWrapper/TaskLog";
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
  async (moduleB, console) => {
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
    // await TestService.testAll2(ctxA);
    await TestService.testChainCall(ctxA);
  },
  async (moduleB, console) => {
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

    const thinkSync = moduleB.asyncToSync(ctxA.think);
    {
      const startTime = Date.now();
      thinkSync(200);
      const endTime = Date.now();
      const diffTime = endTime - startTime;
      console.assert(diffTime >= 200, `thinkSync (${diffTime}ms)`);
    }
    const fibAsync = moduleB.syncToAsync(ctxA.work);
    {
      const times: number[] = [Date.now()];
      const interval = 10;
      const ti = setInterval(() => {
        times.push(Date.now());
      }, interval);
      const tick = setInterval(() => {
        process.stdout.write(new Date().toString() + "\n");
      }, 1000);
      const startTime = Date.now();
      const taskList = Array.from({ length: 10 }, (_, i) => {
        return fibAsync(30);
      });
      await Promise.all(taskList);
      const endTime = Date.now();
      const diffTime = endTime - startTime;
      clearInterval(ti);
      clearInterval(tick);

      /// 寻找最长和最短的间隔
      let min = Infinity;
      let max = -Infinity;
      for (let i = 1; i < times.length; i++) {
        const diff = times[i] - times[i - 1];
        if (diff < min) {
          min = diff;
        }
        if (diff > max) {
          max = diff;
        }
      }

      console.log(`fibAsync [${min}~${max}] (${diffTime}ms)`);
      console.assert(
        min >= interval / 2 && max <= interval * 2,
        `fibAsync [${min}~${max}] (${diffTime}ms)`,
      );
    }
  },
);
