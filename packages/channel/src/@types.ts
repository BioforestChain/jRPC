declare namespace BFChainComlink {
  namespace Channel {
    interface Duplex<TB> {
      onMessage(cb: (msg: DuplexMessage<TB>) => unknown): unknown;
      postMessage(msg: DuplexMessage<TB>): unknown;
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
