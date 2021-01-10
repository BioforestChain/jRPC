import type { MessagePort } from "worker_threads";

export class Endpoint implements BFChainLink.Duplex.Endpoint {
  constructor(private _port: MessagePort) {}
  onMessage(
    listener: BFChainLink.BinaryPort.Listener<BFChainLink.Duplex.Endpoint.Message>,
  ): void {
    this._port.addListener("message", listener);
  }
  postMessage = this._port.postMessage.bind(
    this._port,
  ) as BFChainLink.Duplex.Endpoint["postMessage"];
}

// export const EndpointFactory: BFChainLink.Duplex.EndpointFactory = (port: MessagePort) => {
//   return new Endpoint(port);
// };
