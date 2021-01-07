import { Comlink, ComlinkAsync, ComlinkSync } from "@bfchain/comlink";
import { DuplexFactory } from "@bfchain/comlink-duplex-browser";
// import {} from "../innerComlink/index";
import { TaskLog } from "./TaskLog";

export async function installWebEnv(
  scriptUrl: string | undefined,
  mainThreadCallback: (module: ComlinkAsync) => unknown,
  workerThreadCallback: (module: ComlinkAsync, console: TaskLog) => unknown,
  workerThreadCallback2: (module: ComlinkSync, console: TaskLog) => unknown,
) {
  type Msg = {
    mcPort: MessagePort;
    localSab: SharedArrayBuffer;
    remoteSab: SharedArrayBuffer;
  };
  if (scriptUrl) {
    console.log("main started");

    /// 模拟A模块作为服务模块
    try {
      {
        const duplexFactory = new DuplexFactory();
        const comlink = new Comlink(duplexFactory.getDuplex());
        /**模块控制器 */
        const moduleA = comlink.asyncModule("A1");

        // 执行回调
        await mainThreadCallback(moduleA);
        {
          /// 启动子线程，并将messagechannel发送给子线程
          const worker = new Worker(scriptUrl, {
            name: "async",
          });
          worker.onmessage = (e) => e.data === "exit" && worker.terminate();
          // 执行发送
          duplexFactory.asMain(worker);
        }
      }

      {
        const duplexFactory2 = new DuplexFactory();
        const comlink = new Comlink(duplexFactory2.getDuplex());

        const moduleA2 = comlink.asyncModule("A2");
        // 执行回调
        await mainThreadCallback(moduleA2);
        {
          /// 启动子线程，并将messagechannel发送给子线程
          const worker = new Worker(scriptUrl, {
            name: "sync",
          });
          worker.onmessage = (e) => e.data === "exit" && worker.terminate();
          // 执行发送
          duplexFactory2.asMain(worker);
        }
      }
    } catch (err) {
      console.error("❌ Main Error", err?.stack ?? err);
      return;
    }
  } else {
    const mode = self.name;
    const console = new TaskLog(`mix-${mode}`);
    console.log(`worker ${mode} started`);

    try {
      /// 等待通道连接到位
      const duplex = await DuplexFactory.asCluster(self);
      const comlink = new Comlink(duplex);
      if (mode === "async") {
        /// 模拟B模块作为调用模块
        /**模块控制器 */
        const moduleB = comlink.asyncModule("B");
        // 回调
        await workerThreadCallback(moduleB, console);
      } else {
        /**模块控制器 */
        const moduleB2 = comlink.syncModule("B2");
        // 回调
        await workerThreadCallback2(moduleB2, console);
      }

      console.finish();
    } catch (err) {
      console.error("❌ Worker Error", err?.stack ?? err);
    }
    // 退出子线程
    setTimeout(() => {
      self.postMessage("exit");
    }, 10);
  }
}
