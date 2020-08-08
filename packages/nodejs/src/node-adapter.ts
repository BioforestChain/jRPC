/// <reference lib="dom"/>
import { ComlinkFactory, $expose, $wrap } from "@bfchain/comlink";
import "./@types";
import { MessageChannel, MessagePort } from "worker_threads";

export function nodeEndpointTransfer(
  nep: BFChainComlink.NodeEndpoint
): BFChainComlink.Endpoint<BFChainComlink.NodejsTransferable> {
  const listeners = new WeakMap();
  return {
    postMessage: nep.postMessage.bind(nep),
    addEventListener: (_: string, eh: any) => {
      const l = (data: any) => {
        if ("handleEvent" in eh) {
          eh.handleEvent({ data } as MessageEvent);
        } else {
          eh({ data } as MessageEvent);
        }
      };
      nep.on("message", l);
      listeners.set(eh, l);
    },
    removeEventListener: (_: string, eh: any) => {
      const l = listeners.get(eh);
      if (!l) {
        return;
      }
      nep.off("message", l);
      listeners.delete(eh);
    },
    start: nep.start && nep.start.bind(nep)
  };
}

export class NodejsComlinkFactory extends ComlinkFactory<
  BFChainComlink.NodejsTransferable
> {
  protected $initProxyTransferProto() {
    const proxyTransferProto: BFChainComlink.TransferProto<
      BFChainComlink.ProxyMarked,
      MessagePort,
      BFChainComlink.Remote<unknown, BFChainComlink.NodejsTransferable>,
      BFChainComlink.NodejsTransferable
    > = {
      serialize: obj => {
        const { port1, port2 } = new MessageChannel();
        this.expose(
          obj,
          (port1 as unknown) as BFChainComlink.Endpoint<
            BFChainComlink.NodejsTransferable
          >
        );
        return [
          port2,
          [(port2 as unknown) as BFChainComlink.NodejsTransferable]
        ];
      },
      deserialize: (port: MessagePort) => {
        port.start();
        return this.wrap(
          (port as unknown) as BFChainComlink.Endpoint<
            BFChainComlink.NodejsTransferable
          >
        );
      }
    };
    this.$tp.protos.set(this.proxyMarker, proxyTransferProto);
  }
}
