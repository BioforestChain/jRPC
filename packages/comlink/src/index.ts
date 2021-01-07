import "./@types";
export * from "@bfchain/comlink-core";
export * from "@bfchain/comlink-protocol";
export * from "@bfchain/comlink-sync";
export * from "@bfchain/comlink-async";
export * from "@bfchain/comlink-duplex-core";

import { AsyncBinaryChannel, SyncBinaryChannel } from "@bfchain/comlink-channel";
import { ComlinkAsync } from "@bfchain/comlink-async";
import { ComlinkSync } from "@bfchain/comlink-sync";
import { ExportStore, ImportStore } from "@bfchain/comlink-core";

export class Comlink {
  constructor(
    private duplex: BFChainComlink.Channel.Duplex<ComlinkProtocol.TB>,
    private options: Partial<BFChainComlink.ComlinkOptions> = {},
  ) {}
  transfer(transferable: unknown) {
    // this.duplex.simplexBinary();
  }
  private name = this.options.name || "comlink";

  asyncModule(moduleName = this.name) {
    if (!this.duplex.supports.has("async")) {
      throw new TypeError("duplex no support async mode");
    }
    const binaryChannel = new AsyncBinaryChannel<ComlinkProtocol.TB>(this.duplex);
    return new ComlinkAsync(binaryChannel.port, this.name);
  }

  syncModule(moduleName = this.name) {
    if (!this.duplex.supports.has("sync")) {
      throw new TypeError("duplex no support sync mode");
    }
    const binaryChannel = new SyncBinaryChannel<ComlinkProtocol.TB>(this.duplex);
    return new ComlinkSync(binaryChannel.port, moduleName);
  }
}
