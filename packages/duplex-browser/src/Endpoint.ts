export class Endpoint implements BFChainLink.Duplex.Endpoint {
  constructor(private _port: MessagePort) {}
  onMessage(
    listener: BFChainLink.BinaryPort.Listener<BFChainLink.Duplex.Endpoint.Message>,
  ): void {
    this._port.start();
    this._port.addEventListener("message", (e) => listener(e.data));
  }
  postMessage = this._port.postMessage.bind(this._port);
}

// export const EndpointFactory: BFChainLink.Duplex.EndpointFactory = (port: MessagePort) => {
//   return new Endpoint(port);
// };
