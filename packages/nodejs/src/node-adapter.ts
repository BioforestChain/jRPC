/// <reference lib="dom"/>
import { ComlinkFactory, $expose, $wrap } from "@bfchain/comlink";
import "./@types";
import { MessageChannel, MessagePort } from "worker_threads";

export function nodeEndpointTransfer(nep: BFChainComlink.NodeEndpoint) {
  return new NodeEndpoint(nep);
}

export class NodeEndpoint
  implements BFChainComlink.Endpoint<BFChainComlink.NodejsTransferable> {
  constructor(public readonly nep: BFChainComlink.NodeEndpoint) {}
  private listeners = new WeakMap();
  postMessage = this.nep.postMessage.bind(this.nep);
  addEventListener(
    _: string,
    eh: BFChainComlink.EventListenerOrEventListenerObject
  ) {
    const l = (data: any) => {
      const arg: BFChainComlink.MessageEvent = { type: "message", data };
      if ("handleEvent" in eh) {
        eh.handleEvent(arg);
      } else {
        eh(arg);
      }
    };
    this.nep.on("message", l);
    this.listeners.set(eh, l);
  }
  removeEventListener(
    _: string,
    eh: BFChainComlink.EventListenerOrEventListenerObject
  ) {
    const l = this.listeners.get(eh);
    if (!l) {
      return;
    }
    this.nep.off("message", l);
    this.listeners.delete(eh);
  }
  start = this.nep.start && this.nep.start.bind(this.nep);
  close = this.nep.close && this.nep.close.bind(this.nep);
}

export class NodejsComlinkFactory extends ComlinkFactory<
  BFChainComlink.NodejsTransferable
> {
  protected $createMessageChannel() {
    const { port2, port1 } = new MessageChannel();
    return {
      port1: nodeEndpointTransfer(port1),
      port2: nodeEndpointTransfer(port2),
      transferablePort1: port1,
      transferablePort2: port2
    };
  }
  protected $initMessagePortTransferProto() {
    const MP_TransferProto: BFChainComlink.TransferProto<
      MessagePort,
      MessagePort,
      MessagePort,
      BFChainComlink.NodejsTransferable
    > = {
      serialize(port) {
        return [port, [port]];
      },
      deserialize(port) {
        return port;
      }
    };
    this.$tp.protos.set("Comlink.MessagePort", MP_TransferProto);

    const NE_TransferProto: BFChainComlink.TransferProto<
      NodeEndpoint,
      MessagePort,
      NodeEndpoint,
      BFChainComlink.NodejsTransferable
    > = {
      serialize(nodeEndepoint) {
        if (nodeEndepoint.nep instanceof MessagePort) {
          return [nodeEndepoint.nep, [nodeEndepoint.nep]];
        }
        throw new Error("need implement stream.Transform");
      },
      deserialize(port) {
        return nodeEndpointTransfer(port);
      }
    };
    this.$tp.protos.set("Comlink.NodeEndpoint", NE_TransferProto);
  }
  protected $initProxyTransferProto() {
    const proxyTransferProto: BFChainComlink.TransferProto<
      BFChainComlink.ProxyMarked,
      MessagePort,
      BFChainComlink.Remote<unknown, BFChainComlink.NodejsTransferable>,
      BFChainComlink.NodejsTransferable
    > = {
      serialize: obj => {
        const { port1, port2 } = new MessageChannel();
        this.expose(obj, nodeEndpointTransfer(port1));
        return [port2, [port2]];
      },
      deserialize: (port: MessagePort) => {
        port.start();
        return this.wrap(nodeEndpointTransfer(port));
      }
    };
    this.$tp.protos.set(this.proxyMarker, proxyTransferProto);
  }
}
