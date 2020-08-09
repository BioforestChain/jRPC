import { requestResponseMessage, closeEndPoint } from "@bfchain/comlink-helper";
import {
  MessageType,
  RELEASE_PROXY_SYMBOL,
  CREATE_ENDPOINT_SYMBOL,
  SAFE_TYPE_SYMBOL
} from "@bfchain/comlink-typings";
import { fromWireValue } from "./fromWireValue";
import { toWireValue } from "./toWireValue";
import type { TransferRepo } from "@bfchain/comlink-map";

export function wrap<T, TA = Transferable>(
  tp: TransferRepo<TA>,
  ep: BFChainComlink.Endpoint<TA>,
  target?: any
): BFChainComlink.Remote<T, TA> {
  return createProxy<T, TA>(tp, ep, [], target) as any;
}

const throwIfProxyReleased = (isReleased: boolean) => {
  if (isReleased) {
    throw new Error("Proxy has been released and is not useable");
  }
};
const myFlat = <T>(arr: (T | T[])[]): T[] => {
  return Array.prototype.concat.apply([], arr);
};

const processArguments = <TA = Transferable>(
  tp: TransferRepo<TA>,
  argumentList: any[]
): [BFChainComlink.WireValue[], TA[]] => {
  const processed = argumentList.map(arg => toWireValue(tp, arg));
  return [processed.map(v => v[0]), myFlat(processed.map(v => v[1]))];
};

function createProxy<T, TA = Transferable>(
  tp: TransferRepo<TA>,

  ep: BFChainComlink.Endpoint<TA>,
  path: (string | number | symbol)[] = [],
  target: object = function () {}
): BFChainComlink.Remote<T, TA> {
  let isProxyReleased = false;
  const _fromWireValue = fromWireValue.bind(null, tp);
  const proxy: object = new Proxy(target, {
    get(_target, prop) {
      throwIfProxyReleased(isProxyReleased);
      if (prop === RELEASE_PROXY_SYMBOL) {
        return () => {
          return requestResponseMessage<TA, BFChainComlink.WireValue>(
            ep,
            {
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
        const r = requestResponseMessage<TA, BFChainComlink.WireValue>(
          ep,
          {
            type: MessageType.GET,
            path: path.map(p => p.toString())
          },
          _fromWireValue
        );
        return r.then.bind(r);
      }
      return createProxy<unknown, TA>(tp, ep, [...path, prop]);
    },
    set(_target, prop, rawValue) {
      throwIfProxyReleased(isProxyReleased);

      const [value, transferables] = toWireValue(tp, rawValue);
      requestResponseMessage<TA, BFChainComlink.WireValue>(
        ep,
        {
          type: MessageType.SET,
          path: [...path, prop].map(p => p.toString()),
          value
        },
        _fromWireValue,
        transferables
      );
      return true;
    },
    apply(_target, _thisArg, rawArgumentList) {
      throwIfProxyReleased(isProxyReleased);
      const last = path[path.length - 1];
      if (last === CREATE_ENDPOINT_SYMBOL) {
        return requestResponseMessage<TA, BFChainComlink.WireValue>(
          ep,
          {
            type: MessageType.ENDPOINT
          },
          _fromWireValue
        );
      }
      // We just pretend that `bind()` didn’t happen.
      if (last === "bind") {
        return createProxy(tp, ep, path.slice(0, -1));
      }
      const [argumentList, transferables] = processArguments(
        tp,
        rawArgumentList
      );
      return requestResponseMessage<TA, BFChainComlink.WireValue>(
        ep,
        {
          type: MessageType.APPLY,
          path: path.map(p => p.toString()),
          argumentList
        },
        _fromWireValue,
        transferables
      );
    },
    construct(_target, rawArgumentList) {
      throwIfProxyReleased(isProxyReleased);
      const [argumentList, transferables] = processArguments(
        tp,
        rawArgumentList
      );
      return requestResponseMessage<TA, BFChainComlink.WireValue>(
        ep,
        {
          type: MessageType.CONSTRUCT,
          path: path.map(p => p.toString()),
          argumentList
        },
        _fromWireValue,
        transferables
      );
    }
  });
  return proxy as any;
}
