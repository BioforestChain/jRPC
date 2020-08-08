/// <reference lib="dom"/>
import type {} from "@bfchain/comlink-typings";
import "./@types";

export function nodeEndpointTransfer(
  nep: BFChainComlink.NodeEndpoint
): BFChainComlink.Endpoint {
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
