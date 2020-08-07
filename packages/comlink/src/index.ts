import "@bfchain/comlink-typings";
import "./transfer/handler-proxy";
import "./transfer/handler-throw";
export * from "./windowEndpoint";
export {
  transferHandlers,
  transferClasses,
  transferProtos
} from "@bfchain/comlink-map";
export { wrap, expose, proxy } from "@bfchain/comlink-core";
export {
  RELEASE_PROXY_SYMBOL as releaseProxy,
  CREATE_ENDPOINT_SYMBOL as createEndpoint,
  PROXY_MARKER as proxyMarker,
  THROW_MARKER as throwMarker,
  TRANSFER_PROTO_SYMBOL as transferProto
} from "@bfchain/comlink-typings";
