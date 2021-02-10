declare namespace BFChainLink {
  interface Duplex extends Channel.Duplex<ComlinkProtocol.TB> {}
  namespace Duplex {
    type _ = typeof import("@bfchain/link-protocol");
    interface Factory<MP_O = any, MP_C = any> {
      getDuplex(): Duplex;
      asMain(worker: MP_O & Partial<MP_C>): void;
    }
    namespace Factory {
      interface Ctor<MP_I = any, MP_O = any, MP_C = any> {
        new (): Factory<MP_O, MP_C>;
        asCluster: AsCluster<MP_I, MP_C>;
        prototype: Factory<MP_O, MP_C>;
      }
      type AsCluster<MP_I = any, MP_C = any> = (
        worker: MP_I & Partial<MP_C>,
      ) => PromiseLike<Duplex>;
    }

    type SABS = { locale: SharedArrayBuffer; remote: SharedArrayBuffer };
    type CachedChunkInfo = Map<number, Uint8Array>; // { chunk: Uint8Array; range: [{ start: number; end: number }] };
    type PostMessage_ApplyWrite_HookArg = {
      waitI32a: Int32Array;
      waitIndex: number;
      waitValue: number;
      next: () => void;
    };
    type PostMessage_ChunkReady_HookArg = {
      waitI32a: Int32Array;
      waitIndex: number;
      waitValue: number;
      chunkCount: number;
      chunkId: number;
      next: () => void;
    };

    type Endpoint = {
      onMessage(listener: (data: Endpoint.Message) => unknown): void;
      postMessage(data: Endpoint.Message, transferList: Array<object>): void;
      postMessage(data: Endpoint.Message): void;
    };
    namespace Endpoint {
      type Message =
        | [import("./const").SIMPLEX_MSG_TYPE.NOTIFY, Uint8Array]
        | [import("./const").SIMPLEX_MSG_TYPE.TRANSFER, object];
    }
    // type EndpointFactory = (port: unknown) => Endpoint;
  }
}
