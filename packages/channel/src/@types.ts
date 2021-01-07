declare namespace BFChainComlink {
  namespace Channel {
    type TransferModes = "async" | "sync" /* sharedArrayBuffer */;
    type Supports = TransferModes;
    interface Duplex<TB> extends SyncDuplex<TB>, AsyncDuplex<TB> {}
    namespace Duplex {
      interface Base {
        readonly supports: Set<Supports>;
      }
    }
    interface AsyncDuplex<TB> extends Duplex.Base {
      onMessage(cb: (msg: DuplexMessage<TB>) => unknown): unknown;
      postAsyncMessage(msg: DuplexMessage<TB>): unknown;
    }
    interface SyncDuplex<TB> extends Duplex.Base {
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
