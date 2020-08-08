import {
  requestResponseMessage,
  closeEndPoint,
  generateUUID
} from "@bfchain/comlink-helper";
import {
  MessageType,
  RELEASE_PROXY_SYMBOL,
  CREATE_ENDPOINT_SYMBOL,
  SAFE_TYPE_SYMBOL
} from "@bfchain/comlink-typings";
import { fromWireValue } from "./fromWireValue";
import { toWireValue } from "./toWireValue";

export function wrap<T>(
  ep: BFChainComlink.Endpoint,
  target?: any
): BFChainComlink.Remote<T> {
  return createProxy<T>(ep, [], target) as any;
}

const throwIfProxyReleased = (isReleased: boolean) => {
  if (isReleased) {
    throw new Error("Proxy has been released and is not useable");
  }
};
const myFlat = <T>(arr: (T | T[])[]): T[] => {
  return Array.prototype.concat.apply([], arr);
};

const processArguments = (
  argumentList: any[]
): [BFChainComlink.WireValue[], Transferable[]] => {
  const processed = argumentList.map(toWireValue);
  return [processed.map(v => v[0]), myFlat(processed.map(v => v[1]))];
};

function createProxy<T>(
  ep: BFChainComlink.Endpoint,
  path: (string | number | symbol)[] = [],
  target: object = function () {}
): BFChainComlink.Remote<T> {
  let isProxyReleased = false;
  const proxy: object = new Proxy(target, {
    get(_target, prop) {
      throwIfProxyReleased(isProxyReleased);
      if (prop === RELEASE_PROXY_SYMBOL) {
        return () => {
          return requestResponseMessage(
            ep,
            {
              id: generateUUID(),
              type: MessageType.RELEASE,
              path: path.map(p => p.toString())
            },
            () => {
              closeEndPoint(ep);
              isProxyReleased = true;
            }
          );
        };
      }
      if (prop === SAFE_TYPE_SYMBOL) {
        return proxy;
      }
      if (prop === "then") {
        if (path.length === 0) {
          return { then: () => proxy };
        }
        const r = requestResponseMessage(
          ep,
          {
            id: generateUUID(),
            type: MessageType.GET,
            path: path.map(p => p.toString())
          },
          fromWireValue
        );
        return r.then.bind(r);
      }
      return createProxy(ep, [...path, prop]);
    },
    set(_target, prop, rawValue) {
      throwIfProxyReleased(isProxyReleased);
      const id = generateUUID();

      const [value, transferables] = toWireValue(id, rawValue);
      requestResponseMessage(
        ep,
        {
          id,
          type: MessageType.SET,
          path: [...path, prop].map(p => p.toString()),
          value
        },
        fromWireValue,
        transferables
      );
      return true;
    },
    apply(_target, _thisArg, rawArgumentList) {
      throwIfProxyReleased(isProxyReleased);
      const last = path[path.length - 1];
      if (last === CREATE_ENDPOINT_SYMBOL) {
        return requestResponseMessage(
          ep,
          {
            id: generateUUID(),
            type: MessageType.ENDPOINT
          },
          fromWireValue
        );
      }
      // We just pretend that `bind()` didn’t happen.
      if (last === "bind") {
        return createProxy(ep, path.slice(0, -1));
      }
      const [argumentList, transferables] = processArguments(rawArgumentList);
      return requestResponseMessage(
        ep,
        {
          id: generateUUID(),
          type: MessageType.APPLY,
          path: path.map(p => p.toString()),
          argumentList
        },
        fromWireValue,
        transferables
      );
    },
    construct(_target, rawArgumentList) {
      throwIfProxyReleased(isProxyReleased);
      const [argumentList, transferables] = processArguments(rawArgumentList);
      return requestResponseMessage(
        ep,
        {
          id: generateUUID(),
          type: MessageType.CONSTRUCT,
          path: path.map(p => p.toString()),
          argumentList
        },
        fromWireValue,
        transferables
      );
    }
  });
  return proxy as any;
}
