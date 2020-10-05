import { installSimpleEnv } from "./envWrapper/simpleEnv";
import { CGService } from "./testTemplate/memoryTest";

installSimpleEnv(
  (moduleA) => {
    /**生成服务 */
    const ctxA = new CGService();

    /**
     * 导出服务
     * 同语法： export default ctxA
     */
    moduleA.export(ctxA);
  },
  (moduleB) => {
    /**
     * 导入服务
     * 同语法：
     * import ctx from port
     * import {a} from port
     */
    const ctxA = moduleB.import<CGService>();

    return CGService.testAll(ctxA, 10000);
  },
);
