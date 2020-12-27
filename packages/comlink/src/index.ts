import "./@types";
export * from "@bfchain/comlink-core";
export * from "@bfchain/comlink-protocol";
export * from "@bfchain/comlink-sync";
export * from "@bfchain/comlink-async";
import { AsyncBinaryChannel, SyncBinaryChannel } from "@bfchain/comlink-channel";
import { ComlinkAsync } from "@bfchain/comlink-async";
import { ComlinkSync } from "@bfchain/comlink-sync";

export class Comlink {
  constructor(options: Partial<BFChainComlink.ComlinkOptions>) {}

  static asyncModuleCreater(moduleName: string, duplexFactory: BFChainComlink.DuplexFactory) {
    const duplex = duplexFactory.create();
    return this.asyncModule(moduleName, duplex);
  }
  static syncModuleCreater(moduleName: string, duplexFactory: BFChainComlink.DuplexFactory) {
    const duplex = duplexFactory.create();
    return this.syncModule(moduleName, duplex);
  }

  static asyncModule(
    moduleName: string,
    duplex: BFChainComlink.Channel.Duplex<ComlinkProtocol.TB>,
  ) {
    if (!duplex.supportModes.has("async")) {
      throw new TypeError("duplex no support async mode");
    }
    const binaryChannel = new AsyncBinaryChannel<ComlinkProtocol.TB>(duplex);
    return new ComlinkAsync(binaryChannel.port, moduleName);
  }

  static syncModule(moduleName: string, duplex: BFChainComlink.Channel.Duplex<ComlinkProtocol.TB>) {
    if (!duplex.supportModes.has("sync")) {
      throw new TypeError("duplex no support sync mode");
    }
    const binaryChannel = new SyncBinaryChannel<ComlinkProtocol.TB>(duplex);
    return new ComlinkSync(binaryChannel.port, moduleName);
  }
}
