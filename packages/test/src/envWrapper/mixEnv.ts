import { Comlink, ComlinkAsync } from "@bfchain/comlink";
import { PromiseOut } from "@bfchain/util-extends-promise-out";
import { Worker, isMainThread, MessagePort, parentPort } from "worker_threads";
import { DuplexFactory } from "@bfchain/comlink-duplex-nodejs";
import {} from "../innerComlink/index";

export async function installMixEnv(
  mainThreadCallback: (module: ComlinkAsync) => unknown,
  workerThreadCallback: (module: ComlinkAsync) => unknown,
) {
  type Msg = {
    mcPort: MessagePort;
    localSab: SharedArrayBuffer;
    remoteSab: SharedArrayBuffer;
  };
  if (isMainThread) {
    console.log("main started");

    /// 模拟A模块作为服务模块
    try {
      const duplexFactory = new DuplexFactory();
      /**模块控制器 */
      const moduleA = Comlink.asyncModuleCreater("A", duplexFactory);

      // 执行回调
      await mainThreadCallback(moduleA);

      /// 启动子线程，并将messagechannel发送给子线程
      const worker = new Worker(process.mainModule!.filename, { execArgv: process.argv });
      worker.once("exit", () => process.exit());
      // 执行发送
      duplexFactory.asMain(worker);
    } catch (err) {
      console.error("❌ Main Error", err?.stack ?? err);
      return;
    }
  } else {
    console.log("worker started");
    if (!parentPort) {
      throw new TypeError();
    }
    try {
      /// 等待通道连接到位
      const duplex = await DuplexFactory.asCluster(parentPort);

      /// 模拟B模块作为调用模块
      /**模块控制器 */
      const moduleB = Comlink.asyncModule("B", duplex);

      // 回调
      await workerThreadCallback(moduleB);

      console.log("✅ ~ all test passed!");
    } catch (err) {
      console.error("❌ Worker Error", err?.stack ?? err);
    }
    // 退出子线程
    setTimeout(() => {
      process.exit();
    }, 1);
  }
}

export async function* messageStream<M>(port: MessagePort) {
  const cacheMsg: M[] = [];
  let po: PromiseOut<M> | undefined;
  port.on("message", (msg) => {
    if (po) {
      po.resolve(msg);
    } else {
      cacheMsg.push(msg);
    }
  });
  do {
    if (cacheMsg.length !== 0) {
      for (const msg of cacheMsg) {
        yield msg;
      }
      cacheMsg.length = 0;
    }
    po = new PromiseOut();
    yield await po.promise;
    po = undefined;
  } while (true);
}
