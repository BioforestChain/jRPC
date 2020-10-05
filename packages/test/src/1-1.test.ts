import { installSimpleEnv } from "./envWrapper/simpleEnv";
import { TestService } from "./testTemplate/commonTest";

installSimpleEnv(
  (moduleA) => {
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
  },
  (moduleB) => {
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
    return TestService.testAll(ctxA);
  },
);
