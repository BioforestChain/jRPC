import "@bfchain/comlink-typings";
import "./@types";
export * from "./const";
export * from "./transferHandlerMap";
export * from "./transferClassMap";
export * from "./transferProtoMap";

import { TransferHandlerMap } from "./transferHandlerMap";
import { TransferClassMap } from "./transferClassMap";
import { TransferProtoMap } from "./transferProtoMap";

export const transferHandlers = new TransferHandlerMap();
export const transferClasses = new TransferClassMap();
export const transferProtos = new TransferProtoMap();
