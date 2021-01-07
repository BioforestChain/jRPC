export class Endpoint implements BFChainComlink.Duplex.Endpoint {
  constructor(private _port: MessagePort) {}
  onMessage(
    listener: BFChainComlink.BinaryPort.Listener<BFChainComlink.Duplex.Endpoint.Message>,
  ): void {
    this._port.start();
    this._port.addEventListener("message", (e) => listener(e.data));
  }
  postMessage = this._port.postMessage.bind(this._port);
}

// export const EndpointFactory: BFChainComlink.Duplex.EndpointFactory = (port: MessagePort) => {
//   return new Endpoint(port);
// };
