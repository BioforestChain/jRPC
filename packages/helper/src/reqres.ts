import { generateUUID } from "./uuid";

const requestCallbackMapCacher = new WeakMap<
  BFChainComlink.Endpoint<unknown>,
  Map<BFChainComlink.MessageID, Function>
>();
const forceGetEndpointRCM = <TA>(
  ep: BFChainComlink.Endpoint<TA>
): Map<BFChainComlink.MessageID, Function> => {
  let reqCbMap = requestCallbackMapCacher.get(ep);
  if (!reqCbMap) {
    const map = (reqCbMap = new Map());
    ep.addEventListener("message", (ev: BFChainComlink.MessageEvent) => {
      const message = ev.data as any;
      if (message && message.id) {
        const cb = map.get(message.id);
        if (cb) {
          map.delete(message.id);
          cb(ev.data);
        }
      }
    });
    if (ep.start) {
      ep.start();
    }
  }
  return reqCbMap;
};

export function requestResponseMessage<
  TA = Transferable,
  R = unknown,
  O = unknown
>(
  ep: BFChainComlink.Endpoint<TA>,
  msg: BFChainComlink.MessageArg,
  callback: (res: R) => O,
  transfers?: TA[]
) {
  const reqCbMap = forceGetEndpointRCM(ep);
  return new Promise<O>((resolve, reject) => {
    const id = generateUUID();
    reqCbMap.set(id, (res: R) => {
      try {
        resolve(callback(res));
      } catch (err) {
        reject(err);
      }
    });
    ((msg as unknown) as BFChainComlink.Message).id = id;
    ep.postMessage(msg, transfers);
  });
}
