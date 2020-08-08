declare namespace BFChainComlink {
  interface NodeEndpoint {
    postMessage(message: any, transfer?: any[]): void;
    on(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: {}
    ): void;
    off(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: {}
    ): void;
    start?: () => void;
  }
}
