import { installMixEnv } from "./envWrapper/mixEnv";
import { MessageChannel, MessagePort } from "worker_threads";
import { PromiseOut } from "@bfchain/util-extends-promise-out";

type TestPort = (port: MessagePort) => void;
installMixEnv(
  (moduleA) => {
    const testPort: TestPort = (port: MessagePort) => {
      port.postMessage(`msg from [${moduleA.name}]`);
      port.addListener("message", (data) => {
        console.log(`[${moduleA.name}] got msg`, data);
      });
      port.start();
    };
    moduleA.export(testPort);
  },
  async (moduleB, console) => {
    const mc = new MessageChannel();
    await moduleB.push(mc.port1);
    const port = mc.port2;
    port.postMessage({ test: `msg from [${moduleB.name}]` });
    port.addListener("message", (data) => {
      console.log(`[${moduleB.name}] got msg`, data);
    });
    mc.port2.start();
    await (await moduleB.import<TestPort>())(mc.port1);
  },
  async (moduleB, console) => {
    const po = new PromiseOut<void>();
    const mc = new MessageChannel();
    moduleB.push(mc.port1);
    const port = mc.port2;
    port.postMessage({ test: `msg from [${moduleB.name}]` });
    port.addListener("message", (data) => {
      console.log(`[${moduleB.name}] got msg`, data);
      po.resolve();
    });
    mc.port2.start();

    moduleB.import<TestPort>()(mc.port1);
    return po.promise;
  },
);
