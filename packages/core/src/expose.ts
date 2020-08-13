import {
  MessageType,
  THROW_MARKER,
  PROXY_MARKER
} from "@bfchain/comlink-typings";
import { closeEndPoint } from "@bfchain/comlink-helper";
import type { TransferRepo } from "@bfchain/comlink-map";

const getParent = (rootObj: any, path: string[]) =>
  path.slice(0, -1).reduce((obj, prop) => obj[prop], rootObj);

const getRawValue = (rootObj: any, path: string[]) =>
  path.reduce((obj, prop) => obj[prop], rootObj);

export function expose<TA = Transferable>(
  tp: TransferRepo<TA>,
  obj: any,
  ep: BFChainComlink.Endpoint<TA>,
  mcCreator: BFChainComlink.MessageChannelCreater<TA>
) {
  ep.addEventListener("message", async function callback(
    ev: BFChainComlink.MessageEvent
  ) {
    if (
      !ev ||
      !ev.data ||
      typeof (ev.data as any).id !== "number" ||
      typeof (ev.data as any).type !== "number"
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
            const path = message.path;
            const parent = getParent(obj, path);
            parent[path[path.length - 1]] = tp.fromWireValue(message.value);
            returnValue = true;
          }
          break;
        case MessageType.APPLY:
          {
            const path = message.path;
            const parent = getParent(obj, path);
            const argumentList = message.argumentList.map(arg =>
              tp.fromWireValue(arg)
            );
            returnValue = await (path.length
              ? parent[path[path.length - 1]]
              : parent
            ).apply(parent, argumentList);
          }
          break;
        case MessageType.CONSTRUCT:
          {
            const RawCtor = getRawValue(obj, message.path);
            const argumentList = message.argumentList.map(arg =>
              tp.fromWireValue(arg)
            );
            const value = await new RawCtor(...argumentList);
            returnValue = proxy(tp, value);
          }
          break;
        case MessageType.ENDPOINT:
          {
            const { port1, port2, transferablePort1 } = mcCreator();
            expose(tp, obj, port2, mcCreator);

            returnValue = port1;
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
        { value } as BFChainComlink.ThrowMarked,
        THROW_MARKER
      );
    }

    const [wireValue, transferables] = tp.toWireValue(returnValue);
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
