export class DataPkg {
  constructor(public readonly name: string, public readonly sab: SharedArrayBuffer) {}
  public readonly si32 = new Int32Array(this.sab);
  public readonly su8 = new Uint8Array(this.sab);
  public readonly su16 = new Uint16Array(this.sab);
}
