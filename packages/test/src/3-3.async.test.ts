import { installNativeEnv } from "./envWrapper/nativeAsyncEnv";
import { ConfigService } from "./testTemplate/benchmarkTest";

installNativeEnv(
  (moduleA) => {
    /**生成服务 */
    const ctxA = new ConfigService();
    /**随便一个常量 */
    const a = 1;
    /**
     * 导出服务
     * 同语法： export default ctxA
     */
    moduleA.export(ctxA);
  },
  async (moduleB) => {
    /**
     * 导入服务
     * 同语法：
     * import ctx from port
     * import {a} from port
     */
    const ctxA = await moduleB.import<ConfigService>();

    const TIMES = 1000;
    console.log("start run test %d times", TIMES);
    const caseTime = await ConfigService.testAll2(ctxA, TIMES);
    console.log("use %d ms", caseTime);
  },
);
