import {
  RELEASE_PROXY_SYMBOL,
  CREATE_ENDPOINT_SYMBOL,
  SAFE_TYPE_SYMBOL,
  PROXY_MARKER,
  THROW_MARKER,
  TRANSFER_PROTO_SYMBOL
} from "@bfchain/comlink-typings";
import { TransferRepo } from "@bfchain/comlink-map";
import { wrap, proxy, expose, customTransfer } from "@bfchain/comlink-core";

export class ComlinkFactory<TA = Transferable> {
  get releaseProxy(): BFChainComlink.ReleaseProxySymbol {
    return RELEASE_PROXY_SYMBOL;
  }
  get createEndpoint(): BFChainComlink.CreateEndpointSymbol {
    return CREATE_ENDPOINT_SYMBOL;
  }
  get safeType(): BFChainComlink.SafeTypeSymbol {
    return SAFE_TYPE_SYMBOL;
  }
  get proxyMarker(): BFChainComlink.ProxyMarker {
    return PROXY_MARKER;
  }
  get throwMarker(): BFChainComlink.ThrowMarker {
    return THROW_MARKER;
  }
  get transferProto(): BFChainComlink.TransferProto.TransferSymbol {
    return TRANSFER_PROTO_SYMBOL;
  }
  protected $tp = new TransferRepo<TA>();
  get transferHandlers() {
    return this.$tp.handlers;
  }
  get transferClasses() {
    return this.$tp.classes;
  }
  get transferProtos() {
    return this.$tp.protos;
  }
  wrap<T>(ep: BFChainComlink.Endpoint<TA>, target?: any) {
    return wrap<T, TA>(this.$tp, ep, target);
  }
  expose(obj: any, ep?: BFChainComlink.Endpoint<TA>) {
    return expose<TA>(this.$tp, obj, ep);
  }
  proxy<T extends object>(obj: T) {
    return proxy<T, TA>(this.$tp, obj);
  }
  transfer<T extends object>(obj: T, transfers: TA[], serialized?: T) {
    return customTransfer(obj, transfers, serialized);
  }

  constructor() {
    this.$initProxyTransferProto();
    this.$initThrowTransferProto();
  }

  protected $initProxyTransferProto() {
    const proxyTransferProto: BFChainComlink.TransferProto<
      BFChainComlink.ProxyMarked,
      MessagePort,
      BFChainComlink.Remote<unknown, TA>,
      TA
    > = {
      serialize: obj => {
        const { port1, port2 } = new MessageChannel();
        this.expose(obj, (port1 as unknown) as BFChainComlink.Endpoint<TA>);
        return [port2, [(port2 as unknown) as TA]];
      },
      deserialize: (port: MessagePort) => {
        port.start();
        return this.wrap((port as unknown) as BFChainComlink.Endpoint<TA>);
      }
    };
    this.$tp.protos.set(PROXY_MARKER, proxyTransferProto);
  }

  protected $initThrowTransferProto() {
    const throwTransferProto: BFChainComlink.TransferProto<
      BFChainComlink.ThrowMarked,
      BFChainComlink.SerializedThrownValue
    > = {
      serialize(error) {
        let serialized: BFChainComlink.SerializedThrownValue;
        if (error instanceof Error) {
          serialized = {
            isError: true,
            value: {
              message: error.message,
              name: error.name,
              stack: error.stack
            }
          };
        } else {
          serialized = {
            isError: false,
            value: error
          };
        }
        return [serialized, []];
      },
      deserialize(serialized) {
        if (serialized.isError) {
          throw Object.assign(
            new Error(serialized.value.message),
            serialized.value
          );
        } else {
          throw serialized.value;
        }
      }
    };
    this.$tp.protos.set(THROW_MARKER, throwTransferProto);
  }
}
