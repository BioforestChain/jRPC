import { installWorkerEnv } from "./envWrapper/workerAsyncEnv";
import { CGService } from "./testTemplate/memoryTest";

installWorkerEnv(
  (moduleA) => {
    /**生成服务 */
    const ctxA = new CGService();

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
    const ctxA = await moduleB.import<CGService>();

    return CGService.testAll2(ctxA, 300);
  },
);
