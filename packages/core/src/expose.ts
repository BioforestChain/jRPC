import {
  MessageType,
  THROW_MARKER,
  PROXY_MARKER
} from "@bfchain/comlink-typings";
import { fromWireValue } from "./fromWireValue";
import { toWireValue, customTransfer } from "./toWireValue";
import { closeEndPoint } from "@bfchain/comlink-helper";
import { transferProtos } from "@bfchain/comlink-map";

export function expose(obj: any, ep: BFChainComlink.Endpoint = self as any) {
  ep.addEventListener("message", async function callback(ev: MessageEvent) {
    if (!ev || !ev.data) {
      return;
    }
    const { id, type, path } = {
      path: [] as string[],
      ...(ev.data as BFChainComlink.Message)
    };
    const argumentList = (ev.data.argumentList || []).map(fromWireValue);
    let returnValue;
    try {
      const parent = path.slice(0, -1).reduce((obj, prop) => obj[prop], obj);
      const rawValue = path.reduce((obj, prop) => obj[prop], obj);
      switch (type) {
        case MessageType.GET:
          {
            returnValue = await rawValue;
          }
          break;
        case MessageType.SET:
          {
            parent[path.slice(-1)[0]] = fromWireValue(ev.data.value);
            returnValue = true;
          }
          break;
        case MessageType.APPLY:
          {
            returnValue = await rawValue.apply(parent, argumentList);
          }
          break;
        case MessageType.CONSTRUCT:
          {
            const value = new rawValue(...argumentList);
            returnValue = proxy(value);
          }
          break;
        case MessageType.ENDPOINT:
          {
            const { port1, port2 } = new MessageChannel();
            expose(obj, port2);
            returnValue = customTransfer(port1, [port1]);
          }
          break;
        case MessageType.RELEASE:
          {
            returnValue = undefined;
          }
          break;
      }
    } catch (value) {
      returnValue = transferProtos.setInstance(
        { value } as BFChainComlink.ThrowMarked,
        THROW_MARKER
      );
    }

    const [wireValue, transferables] = toWireValue(returnValue);
    ep.postMessage({ ...wireValue, id }, transferables);
    if (type === MessageType.RELEASE) {
      // detach and deactive after sending release response above.
      ep.removeEventListener("message", callback as any);
      closeEndPoint(ep);
    }
  } as any);
  if (ep.start) {
    ep.start();
  }
}

export function proxy<T extends object>(obj: T) {
  return transferProtos.setInstance(
    { value: obj } as BFChainComlink.ProxyMarked<T>,
    PROXY_MARKER
  );
}
