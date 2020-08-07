import { generateUUID } from "./uuid";

const requestCallbackMapCacher = new WeakMap<
  BFChainComlink.Endpoint,
  Map<BFChainComlink.MessageID, Function>
>();
const forceGetEndpointRCM = (
  ep: BFChainComlink.Endpoint
): Map<BFChainComlink.MessageID, Function> => {
  let reqCbMap = requestCallbackMapCacher.get(ep);
  if (!reqCbMap) {
    const map = (reqCbMap = new Map());
    ep.addEventListener("message", (ev: MessageEvent) => {
      if (ev.data && ev.data.id) {
        const cb = map.get(ev.data.id);
        if (cb) {
          map.delete(ev.data.id);
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

export function requestResponseMessage<R>(
  ep: BFChainComlink.Endpoint,
  msg: BFChainComlink.Message,
  transfers?: Transferable[]
) {
  const reqCbMap = forceGetEndpointRCM(ep);
  return new Promise<R>(resolve => {
    const id = generateUUID();
    reqCbMap.set(id, resolve);
    ep.postMessage({ id, ...msg }, transfers);
  });
}
