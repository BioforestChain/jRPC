import {
  MessageType,
  THROW_MARKER,
  PROXY_MARKER
} from "@bfchain/comlink-typings";
import { fromWireValue } from "./fromWireValue";
import { toWireValue, customTransfer } from "./toWireValue";
import { closeEndPoint } from "@bfchain/comlink-helper";
import type { TransferRepo } from "@bfchain/comlink-map";

const getParent = (rootObj: any, path: string[]) =>
  path.slice(0, -1).reduce((obj, prop) => obj[prop], rootObj);

const getRawValue = (rootObj: any, path: string[]) =>
  path.reduce((obj, prop) => obj[prop], rootObj);

export function expose<TA = Transferable>(
  tp: TransferRepo<TA>,
  obj: any,
  ep: BFChainComlink.Endpoint<TA> = self as any
) {
  ep.addEventListener("message", async function callback(ev: MessageEvent) {
    if (
      !ev ||
      !ev.data ||
      typeof ev.data.id !== "number" ||
      typeof ev.data.type !== "number"
    ) {
      return;
    }
    const message = ev.data as BFChainComlink.Message;
    // const { id, type, path = [] } = message;
    let returnValue;
    try {
      // const parent = path.slice(0, -1).reduce((obj, prop) => obj[prop], obj);
      // const rawValue = path.reduce((obj, prop) => obj[prop], obj);
      switch (message.type) {
        case MessageType.GET:
          {
            returnValue = await getRawValue(obj, message.path);
          }
          break;
        case MessageType.SET:
          {
            const parent = getParent(obj, message.path);
            parent[message.path[message.path.length - 1]] = fromWireValue(
              tp,
              ev.data.value
            );
            returnValue = true;
          }
          break;
        case MessageType.APPLY:
          {
            const parent = getParent(obj, message.path);
            const argumentList = message.argumentList.map(arg =>
              fromWireValue(tp, arg)
            );
            returnValue = await parent[
              message.path[message.path.length - 1]
            ].apply(parent, argumentList);
          }
          break;
        case MessageType.CONSTRUCT:
          {
            const RawCtor = getRawValue(obj, message.path);
            const argumentList = message.argumentList.map(arg =>
              fromWireValue(tp, arg)
            );
            const value = await new RawCtor(...argumentList);
            returnValue = proxy(tp, value);
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
        default:
          return;
      }
    } catch (value) {
      returnValue = tp.setPropMarker(
        value as BFChainComlink.ThrowMarked,
        THROW_MARKER
      );
    }

    const [wireValue, transferables] = toWireValue(tp, returnValue);
    wireValue.id = message.id;
    ep.postMessage(wireValue, transferables);
    if (message.type === MessageType.RELEASE) {
      // detach and deactive after sending release response above.
      ep.removeEventListener("message", callback);
      closeEndPoint(ep);
    }
  });

  if (ep.start) {
    ep.start();
  }
}

export function proxy<T extends object, TA = Transferable>(
  tp: TransferRepo<TA>,
  obj: T
) {
  return tp.setPropMarker(obj, PROXY_MARKER);
}
