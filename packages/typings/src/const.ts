export const enum WireValueType {
  RAW,
  PROXY,
  THROW,
  HANDLER,
  RAW_ARRAY
}
export const enum MessageType {
  GET,
  SET,
  APPLY,
  CONSTRUCT,
  ENDPOINT,
  RELEASE
}

export class ProxyMarked<V> {
  constructor(public readonly value: V) {}
}

export class ThrowMarker<V> {
  constructor(public readonly value: V) {}
}

// export const proxyMarker = Symbol("Comlink.proxy");
export const createEndpoint = Symbol("Comlink.endpoint");
export const releaseProxy = Symbol("Comlink.releaseProxy");
// export const throwMarker = Symbol("Comlink.throw");

// declare namespace BFChainComlink {
// //   interface ProxyMarked {
// //     [proxyMarker]: true;
// //   }

// //   interface ThrownValue {
// //     [throwMarker]: unknown;
// //     value: unknown;
// //   }
//   type SerializedThrownValue =
//     | { isError: true; value: Error }
//     | { isError: false; value: unknown };
// }
