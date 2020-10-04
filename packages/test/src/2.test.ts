import { InnerComlink, ShareBinaryChannel } from "./index";
import { Worker, isMainThread, MessageChannel, parentPort, threadId } from "worker_threads";
import { TestService } from "./commonTest";

if (isMainThread) {
  console.log("main started");

  const mc = new MessageChannel();
  /**
   * 生成当前线程使用的管道
   */
  const { port: portA, sab } = new ShareBinaryChannel<InnerComlink.TB>(mc.port1);

  /// 模拟A模块作为服务模块
  (async () => {
    /**模块控制器 */
    const moduleA = new InnerComlink(portA, "A");

    /**生成服务 */
    const ctxA = new TestService();

    /**
     * 导出服务
     * 同语法： export ctxA
     */
    moduleA.export(ctxA);
  })();
  const worker = new Worker(module.filename, { execArgv: process.argv });
  worker.postMessage({ sab, mcPort: mc.port2 }, [mc.port2]);
  worker.once("exit", () => process.exit());
} else {
  console.log("worker started");

  parentPort?.once("message", async (msg) => {
    /**
     * 生成当前线程使用的管道
     */
    const { port: portB } = new ShareBinaryChannel<InnerComlink.TB>(msg.mcPort, msg.sab);
    /// 模拟B模块作为调用模块
    (async function () {
      /**模块控制器 */
      const moduleB = new InnerComlink(portB, "B");

      /**
       * 导入服务
       * 同语法：
       * import ctx from port
       */
      const ctxA = moduleB.import<TestService>();

      TestService.testAll(ctxA);
      console.log("🎊 ~ all test passed!");

      process.exit();
    })().catch((err) => {
      console.error("???", err.message);
    });
  });
}
