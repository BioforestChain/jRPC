import { installSimpleEnv } from "./envWrapper/simpleEnv";
import { ConfigService } from "./testTemplate/benchmarkTest";

installSimpleEnv(
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
    const ctxA = moduleB.import<ConfigService>();

    const TIMES = 10000;
    console.log("start run test %d times", TIMES);
    const caseTime = await ConfigService.testAll(ctxA, TIMES);
    console.log("use %d ms", caseTime);
  },
);
