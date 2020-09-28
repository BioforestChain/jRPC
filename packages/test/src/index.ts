import sourceMapSupport from "source-map-support";
sourceMapSupport.install();
import "@bfchain/comlink-typings";
export * from "./InnerComlink";
export * from "./SimpleBinaryChannel";
export * from "./WorkerBinaryChannel";
export * from "./const";
