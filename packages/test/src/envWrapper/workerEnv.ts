import { InnerComlink, ShareBinaryChannel } from "../innerComlink/index";
import {
  Worker,
  isMainThread,
  MessageChannel,
  MessagePort,
  parentPort,
  threadId,
} from "worker_threads";

export async function installWorkerEnv(
  mainThreadCallback: (module: InnerComlink) => unknown,
  workerThreadCallback: (module: InnerComlink) => unknown,
) {
  type Msg = {
    mcPort: MessagePort;
    localSab: SharedArrayBuffer;
    remoteSab: SharedArrayBuffer;
  };
  if (isMainThread) {
    console.log("main started");

    const mc = new MessageChannel();
    /**
     * 生成当前线程使用的管道
     */
    const { port: portA, localSab, remoteSab } = new ShareBinaryChannel<InnerComlink.TB>(mc.port1);

    /// 模拟A模块作为服务模块
    try {
      /**模块控制器 */
      const moduleA = new InnerComlink(portA, "A");

      // 执行回调
      await mainThreadCallback(moduleA);
    } catch (err) {
      console.error("❌ Main Error", err?.stack ?? err);
      return;
    }

    /// 启动子线程
    const worker = new Worker(process.mainModule!.filename, { execArgv: process.argv });
    const msg: Msg = { mcPort: mc.port2, localSab: remoteSab, remoteSab: localSab };
    worker.postMessage(msg, [mc.port2]);
    worker.once("exit", () => process.exit());
  } else {
    console.log("worker started");
    if (!parentPort) {
      throw new TypeError();
    }

    for await (const msg of messageStream<Msg>(parentPort)) {
      try {
        /**
         * 生成当前线程使用的管道
         */
        const { port: portB } = new ShareBinaryChannel<InnerComlink.TB>(
          msg.mcPort,
          msg.localSab,
          msg.remoteSab,
        );
        /// 模拟B模块作为调用模块
        /**模块控制器 */
        const moduleB = new InnerComlink(portB, "B");

        // 回调
        await workerThreadCallback(moduleB);

        console.log("✅ ~ all test passed!");
      } catch (err) {
        console.error("❌ Worker Error", err?.stack ?? err);
      }
      break;
    }
    // 退出子线程
    setTimeout(() => {
      process.exit();
    }, 1);
  }
}

export async function* messageStream<M>(port: MessagePort) {
  class PromiseOut<T> {
    readonly promise: Promise<T>;
    resolve!: (value?: T | PromiseLike<T> | undefined) => void;
    reject!: (reason?: unknown) => void;
    constructor() {
      this.promise = new Promise<T>((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
      });
    }
  }
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
