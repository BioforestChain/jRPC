import {
  RELEASE_PROXY_SYMBOL,
  CREATE_ENDPOINT_SYMBOL,
  SAFE_TYPE_SYMBOL,
  PROXY_MARKER,
  THROW_MARKER,
  TRANSFER_PROTO_SYMBOL,
  WireValueType
} from "@bfchain/comlink-typings";
import { TransferRepo } from "@bfchain/comlink-map";
import {
  wrap,
  proxy,
  expose,
  customTransfer,
  toWireValue
} from "@bfchain/comlink-core";
import { fromWireValue } from "@bfchain/comlink-core/build/cjs/fromWireValue";

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
  expose(obj: any, ep: BFChainComlink.Endpoint<TA> = self as any) {
    return expose<TA>(this.$tp, obj, ep, this.$createMessageChannel);
  }
  proxy<T extends object>(obj: T) {
    return proxy<T, TA>(this.$tp, obj);
  }
  transfer<T extends object>(obj: T, transfers: TA[]) {
    return customTransfer(obj, transfers);
  }

  constructor() {
    this.$initMessagePortTransferProto();
    this.$initProxyTransferProto();
    this.$initThrowTransferProto();
  }

  protected $createMessageChannel() {
    const { port1, port2 } = new MessageChannel();
    return {
      port1,
      port2,
      transferablePort1: port1 as unknown,
      transferablePort2: port2 as unknown
    } as BFChainComlink.MessageChannelCreaterReturn<TA>;
  }

  protected $initMessagePortTransferProto() {
    const proxyTransferProto: BFChainComlink.TransferProto<
      MessagePort,
      MessagePort,
      MessagePort,
      TA
    > = {
      serialize(port) {
        return [port, [(port as unknown) as TA]];
      },
      deserialize(port) {
        return port;
      }
    };
    this.$tp.protos.set("Comlink.MessagePort", proxyTransferProto);
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
      BFChainComlink.SerializedThrownValue,
      never,
      TA
    > = {
      serialize: throwed => {
        const error = throwed.value;
        let serialized: BFChainComlink.SerializedThrownValue;
        let transferable: TA[] | undefined;

        const wireValue = toWireValue(this.$tp, error);
        transferable = wireValue[1];
        serialized = {
          isError: false,
          value: wireValue[0]
        };

        /**如果没有对Error进行自定义解析，那么使用默认方案进行解析 */
        if (
          serialized.value.type === WireValueType.RAW &&
          error instanceof Error
        ) {
          serialized = {
            isError: true,
            value: {
              message: error.message,
              name: error.name,
              stack: error.stack
            }
          };
        }
        return [serialized, transferable || []];
      },
      deserialize: serialized => {
        if (serialized.isError) {
          throw Object.assign(
            new Error(serialized.value.message),
            serialized.value
          );
        } else {
          throw fromWireValue(this.$tp, serialized.value);
        }
      }
    };
    this.$tp.protos.set(THROW_MARKER, throwTransferProto);
  }
}
