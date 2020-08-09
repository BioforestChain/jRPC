declare namespace BFChainComlink {
  interface NodeEndpoint {
    postMessage(message: any, transfer?: any[]): unknown;
    on(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: {}
    ): unknown;
    off(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: {}
    ): unknown;
    start?: () => unknown;
    close?: () => unknown;
  }
  type NodejsTransferable = ArrayBuffer | import("worker_threads").MessagePort;
}
// declare
