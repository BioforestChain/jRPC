declare namespace BFChainComlink {
  type EventSource = import("./lib/comlink/src/protocol").EventSource;
  type PostMessageWithOrigin = import("./lib/comlink/src/protocol").PostMessageWithOrigin;
  type Endpoint = import("./lib/comlink/src/protocol").Endpoint;
  type WireValueType = import("./lib/comlink/src/protocol").WireValueType;
  type RawWireValue = import("./lib/comlink/src/protocol").RawWireValue;
  type HandlerWireValue = import("./lib/comlink/src/protocol").HandlerWireValue;
  type WireValue = import("./lib/comlink/src/protocol").WireValue;
  type MessageID = import("./lib/comlink/src/protocol").MessageID;
  type MessageType = import("./lib/comlink/src/protocol").MessageType;
  type GetMessage = import("./lib/comlink/src/protocol").GetMessage;
  type SetMessage = import("./lib/comlink/src/protocol").SetMessage;
  type ApplyMessage = import("./lib/comlink/src/protocol").ApplyMessage;
  type ConstructMessage = import("./lib/comlink/src/protocol").ConstructMessage;
  type EndpointMessage = import("./lib/comlink/src/protocol").EndpointMessage;
  type Message = import("./lib/comlink/src/protocol").Message;
}
