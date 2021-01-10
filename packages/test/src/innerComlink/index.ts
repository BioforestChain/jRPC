import sourceMapSupport from "source-map-support";
sourceMapSupport.install();

try {
  if (require("inspector").url()) {
    console.info("目前处于调试模式，进程将在任务结束后保持不死");
    /// 调试模式下， 不要杀死进程
    setTimeout(() => {
      console.log("done");
    }, 1000000);
  }
} catch {}

import "@bfchain/link-typings";
export * from "./SimpleBinaryChannel";
export * from "./WorkerBinaryChannel";
export * from "./NativeBinaryChannel";
