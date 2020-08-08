import "@bfchain/comlink-typings";
export * from "./windowEndpoint";
export * from "./factory";

export {
  wrap as $wrap,
  expose as $expose,
  proxy as $proxy,
  customTransfer as $customTransfer
} from "@bfchain/comlink-core";
