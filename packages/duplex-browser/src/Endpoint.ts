export class Endpoint implements BFChainComlink.Duplex.Endpoint {
  constructor(private _port: MessagePort) {}
  onMessage(listener: (data: Uint8Array) => unknown): void {
    this._port.start();
    this._port.addEventListener("message", (e) => listener(e.data));
  }
  postMessage = this._port.postMessage.bind(this._port);
}

// export const EndpointFactory: BFChainComlink.Duplex.EndpointFactory = (port: MessagePort) => {
//   return new Endpoint(port);
// };
