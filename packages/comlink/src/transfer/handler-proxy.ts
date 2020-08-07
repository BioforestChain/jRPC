import { expose, wrap } from "@bfchain/comlink-core";
import { PROXY_MARKER } from "@bfchain/comlink-typings";
import { transferProtos } from "@bfchain/comlink-map";
export const proxyTransferProto: BFChainComlink.TransferProto<
  BFChainComlink.ProxyMarked,
  MessagePort,
  unknown
> = {
  serialize(obj) {
    const { port1, port2 } = new MessageChannel();
    expose(obj, port1);
    return [port2, [port2]];
  },
  deserialize(port: MessagePort) {
    port.start();
    return wrap(port);
  }
};
transferProtos.set(PROXY_MARKER, proxyTransferProto);
