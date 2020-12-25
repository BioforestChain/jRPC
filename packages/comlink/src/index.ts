import "./@types";
export * from "@bfchain/comlink-core";
export * from "@bfchain/comlink-protocol";
export * from "@bfchain/comlink-sync";
export * from "@bfchain/comlink-async";
import { MagicBinaryChannel } from "@bfchain/comlink-channel";
import { ComlinkAsync } from "@bfchain/comlink-async";

export class Comlink {
  constructor(options: Partial<BFChainComlink.ComlinkOptions>) {}

  static asyncModuleCreater(moduleName: string, duplexFactory: BFChainComlink.DuplexFactory) {
    const duplex = duplexFactory.create();
    return this.asyncModule(moduleName, duplex);
  }

  static asyncModule(
    moduleName: string,
    duplex: BFChainComlink.Channel.Duplex<ComlinkProtocol.TB>,
  ) {
    const binaryChannel = new MagicBinaryChannel<ComlinkProtocol.TB>(duplex);
    return new ComlinkAsync(binaryChannel.port, moduleName);
  }

  static syncModule() {}
}
