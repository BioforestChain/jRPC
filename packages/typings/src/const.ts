export const enum WireValueType {
  RAW,
  RAW_ARRAY,

  PROXY,
  THROW,

  HANDLER,
  CLASS,
  PROTO
}
export const enum MessageType {
  GET,
  SET,
  APPLY,
  CONSTRUCT,
  ENDPOINT,
  RELEASE
}

export const PROXY_MARKER: BFChainComlink.ProxyMarker = "Comlink.proxy" as BFChainComlink.ProxyMarker;

export const THROW_MARKER: BFChainComlink.ThrowMarker = "Comlink.throw" as BFChainComlink.ThrowMarker;

export const CREATE_ENDPOINT_SYMBOL: BFChainComlink.CreateEndpointSymbol = Symbol.for(
  "Comlink.endpoint"
) as BFChainComlink.CreateEndpointSymbol;

export const RELEASE_PROXY_SYMBOL: BFChainComlink.ReleaseProxySymbol = Symbol.for(
  "Comlink.releaseProxy"
) as BFChainComlink.ReleaseProxySymbol;

export const SAFE_TYPE_SYMBOL: BFChainComlink.SafeTypeSymbol = Symbol.for(
  "Comlink.safeType"
) as BFChainComlink.SafeTypeSymbol;

export const TRANSFER_CLASS_SYMBOL: BFChainComlink.TransferClass.TransferSymbol = Symbol.for(
  "Comlink.Transfer.Class"
) as BFChainComlink.TransferClass.TransferSymbol;

export const TRANSFER_PROTO_SYMBOL: BFChainComlink.TransferProto.TransferSymbol = Symbol.for(
  "Comlink.Transfer.Proto"
) as BFChainComlink.TransferProto.TransferSymbol;
