import "./@types";
export * from "@bfchain/link-core";
export * from "@bfchain/link-protocol";
export * from "@bfchain/link-sync";
export * from "@bfchain/link-async";
export * from "@bfchain/link-duplex-core";

import { AsyncBinaryChannel, SyncBinaryChannel } from "@bfchain/link-channel";
import { ComlinkAsync } from "@bfchain/link-async";
import { ComlinkSync } from "@bfchain/link-sync";
import { ExportStore, ImportStore } from "@bfchain/link-core";

export class Comlink {
  constructor(
    private duplex: BFChainLink.Channel.Duplex<ComlinkProtocol.TB>,
    private options: Partial<BFChainLink.ComlinkOptions> = {},
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
    return new ComlinkAsync(binaryChannel.port, moduleName);
  }

  syncModule(moduleName = this.name) {
    if (!this.duplex.supports.has("sync")) {
      throw new TypeError("duplex no support sync mode");
    }
    const binaryChannel = new SyncBinaryChannel<ComlinkProtocol.TB>(this.duplex);
    return new ComlinkSync(binaryChannel.port, moduleName);
  }
}
