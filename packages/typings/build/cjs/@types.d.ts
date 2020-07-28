declare namespace BFChainComlink {
    interface EndpointEventMap {
        message: MessageEvent;
    }
    type EndpointEventListenerOrEventListenerObject = ((ev: MessageEvent) => unknown) | {
        handleEvent(evt: MessageEvent): unknown;
    };
    interface EventSource {
        addEventListener<K extends keyof EndpointEventMap>(type: K, listener: EndpointEventListenerOrEventListenerObject, options?: {}): void;
        addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: {}): void;
        removeEventListener<K extends keyof EndpointEventMap>(type: K, listener: EndpointEventListenerOrEventListenerObject, options?: {}): void;
        removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: {}): void;
    }
    interface Endpoint extends EventSource {
        postMessage(message: any, transfer?: Transferable[]): void;
        start?: () => void;
    }
    interface PostMessageWithOrigin {
        postMessage(message: any, targetOrigin: string, transfer?: Transferable[]): void;
    }
    interface RawWireValue {
        id?: string;
        type: import("./const").WireValueType.RAW;
        value: {};
    }
    interface RawListWireValue {
        id?: string;
        type: import("./const").WireValueType.RAW_ARRAY;
        value: WireValue[];
    }
    interface HandlerWireValue {
        id?: string;
        type: import("./const").WireValueType.HANDLER;
        name: string;
        value: {};
    }
    type WireValue = RawWireValue | RawListWireValue | HandlerWireValue;
    type MessageID = string;
    interface GetMessage {
        id?: MessageID;
        type: import("./const").MessageType.GET;
        path: string[];
    }
    interface SetMessage {
        id?: MessageID;
        type: import("./const").MessageType.SET;
        path: string[];
        value: WireValue;
    }
    interface ApplyMessage {
        id?: MessageID;
        type: import("./const").MessageType.APPLY;
        path: string[];
        argumentList: WireValue[];
    }
    interface ConstructMessage {
        id?: MessageID;
        type: import("./const").MessageType.CONSTRUCT;
        path: string[];
        argumentList: WireValue[];
    }
    interface EndpointMessage {
        id?: MessageID;
        type: import("./const").MessageType.ENDPOINT;
    }
    interface ReleaseMessage {
        id?: MessageID;
        type: import("./const").MessageType.RELEASE;
        path: string[];
    }
    type Message = GetMessage | SetMessage | ApplyMessage | ConstructMessage | EndpointMessage | ReleaseMessage;
    interface TransferHandler<T = unknown, S = unknown> {
        canHandle(value: unknown): value is T;
        serialize(obj: T): [S, Transferable[]];
        deserialize(obj: S): T;
    }
}
//# sourceMappingURL=@types.d.ts.map