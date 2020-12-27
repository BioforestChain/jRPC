declare namespace BFChainComlink {
  namespace Channel {
    interface Duplex<TB> extends SyncDuplex<TB>, AsyncDuplex<TB> {
      readonly supportModes: Set<"async" | "sync">;
    }
    interface AsyncDuplex<TB> {
      readonly supportModes: Set<"async" | "sync">;
      onMessage(cb: (msg: DuplexMessage<TB>) => unknown): unknown;
      postAsyncMessage(msg: DuplexMessage<TB>): unknown;
    }
    interface SyncDuplex<TB> {
      readonly supportModes: Set<"async" | "sync">;
      onMessage(cb: (msg: DuplexMessage<TB>) => unknown): unknown;
      postSyncMessage(msg: DuplexMessage<TB>): unknown;
      waitMessage(): DuplexMessage<TB>;
    }
    type DuplexMessage<TB> = DuplexMessageMsg<TB> | DuplexMessageReq<TB> | DuplexMessageRes<TB>;

    type DuplexMessageMsg<TB> = {
      msgType: "SIM";
      msgId: undefined;
      msgContent: TB;
    };
    type DuplexMessageReq<TB> = {
      msgType: "REQ";
      msgId: number;
      msgContent: TB;
    };
    type DuplexMessageRes<TB> = {
      msgType: "RES";
      msgId: number;
      msgContent: BFChainComlink.CallbackArg<TB | undefined>;
    };
  }
}
