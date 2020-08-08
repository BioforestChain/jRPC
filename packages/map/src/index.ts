import "@bfchain/comlink-typings";
import "./@types";
export * from "./const";
export * from "./transferHandlerMap";
export * from "./transferClassMap";
export * from "./transferProtoMap";

import { TransferHandlerMap } from "./transferHandlerMap";
import { TransferClassMap } from "./transferClassMap";
import { TransferProtoMap } from "./transferProtoMap";

export class TransferRepo<TA = Transferable> {
  readonly handlers = new TransferHandlerMap<TA>();
  readonly classes = new TransferClassMap<TA>();
  readonly protos = new TransferProtoMap<TA>();

  setPropMarker<
    V extends object,
    K extends BFChainComlink.TransferProtoKeyValue["Key"]
  >(obj: V, propMarker: K) {
    return this.protos.setInstance(obj, propMarker);
  }
}
