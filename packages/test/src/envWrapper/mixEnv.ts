import { Comlink, ComlinkAsync, ComlinkSync } from "@bfchain/comlink";
import { Worker, isMainThread, MessagePort, parentPort, workerData } from "worker_threads";
import { DuplexFactory } from "@bfchain/comlink-duplex-nodejs";
import {} from "../innerComlink/index";
import { TaskLog } from "./TaskLog";

const comlink = new Comlink();

export async function installMixEnv(
  mainThreadCallback: (module: ComlinkSync) => unknown,
  workerThreadCallback: (module: ComlinkAsync, console: TaskLog) => unknown,
  workerThreadCallback2: (module: ComlinkSync, console: TaskLog) => unknown,
) {
  if (isMainThread) {
    console.log("main started");
    let finishedTestCount = 0;
    const tryFinish = () => {
      finishedTestCount += 1;
      if (finishedTestCount === 2) {
        process.exit();
      }
    };

    /// 模拟A模块作为服务模块
    try {
      {
        const duplexFactory = new DuplexFactory();
        /**模块控制器 */
        const moduleA = comlink.syncModule("A", duplexFactory.getDuplex());

        // 执行回调
        await mainThreadCallback(moduleA);
        {
          /// 启动子线程，并将messagechannel发送给子线程
          const worker = new Worker(process.mainModule!.filename, {
            workerData: "async",
          });
          worker.once("exit", () => tryFinish);
          // 执行发送
          duplexFactory.asMain(worker);
        }
      }

      {
        const duplexFactory2 = new DuplexFactory();

        const moduleA2 = comlink.syncModule("A", duplexFactory2.getDuplex());
        // 执行回调
        await mainThreadCallback(moduleA2);
        {
          /// 启动子线程，并将messagechannel发送给子线程
          const worker = new Worker(process.mainModule!.filename, {
            workerData: "sync",
          });
          worker.once("exit", () => tryFinish);
          // 执行发送
          duplexFactory2.asMain(worker);
        }
      }
    } catch (err) {
      console.error("❌ Main Error", err?.stack ?? err);
      return;
    }
  } else {
    const mode = workerData;
    const console = new TaskLog(`mix-${mode}`);
    console.log(`worker ${mode} started`);
    if (!parentPort) {
      throw new TypeError();
    }
    try {
      /// 等待通道连接到位
      const duplex = await DuplexFactory.asCluster(parentPort);
      if (mode === "async") {
        /// 模拟B模块作为调用模块
        /**模块控制器 */
        const moduleB = comlink.asyncModule("B", duplex);
        // 回调
        await workerThreadCallback(moduleB, console);
      } else {
        /**模块控制器 */
        const moduleB2 = comlink.syncModule("B2", duplex);
        // 回调
        await workerThreadCallback2(moduleB2, console);
      }

      console.finish();
    } catch (err) {
      console.error("❌ Worker Error", err?.stack ?? err);
    }
    // 退出子线程
    setTimeout(() => {
      process.exit();
    }, 10);
  }
}
