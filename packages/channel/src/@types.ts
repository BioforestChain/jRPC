declare namespace BFChainLink {
  namespace Channel {
    type TransferModes = "async" | "sync" /* sharedArrayBuffer */;
    type Supports = TransferModes;
    interface Duplex<TB> extends SyncDuplex<TB>, AsyncDuplex<TB> {}
    namespace Duplex {
      interface Base {
        readonly supports: Set<Supports>;
        onObject(cb: BinaryPort.Listener<object>): void;
        /**
         * 传输“可传送”的对象。
         * 即便当前这个通讯的底层协议是ws等非内存信道，也需要进行模拟实现
         */
        postAsyncObject(obj: object, transfer: object[]): void;
      }
    }
    interface AsyncDuplex<TB> extends Duplex.Base {
      onMessage(cb: BinaryPort.Listener<DuplexMessage<TB>>): unknown;
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
      msgContent: BFChainLink.CallbackArg<TB | undefined>;
    };
  }
}
